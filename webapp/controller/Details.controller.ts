import BaseController from "./BaseController";
import Router from "sap/ui/core/routing/Router";
import { Route$PatternMatchedEvent } from "sap/ui/core/routing/Route";
import View from "sap/ui/core/mvc/View";
import JSONModel from "sap/ui/model/json/JSONModel";
import FlexBox from "sap/m/FlexBox";
import VBox from "sap/m/VBox";
import Context from "sap/ui/model/odata/v4/Context";
import Utils from "../utils/Utils";
import Control from "sap/ui/core/Control";
import SimpleForm from "sap/ui/layout/form/SimpleForm";
import Validator from "../utils/Validator";
import MessageBox from "sap/m/MessageBox";

const FRAGMENT_NAMESPACE = "santos.sapui5productsfe.fragments";

type FormFragmentName = "Display" | "Change";

/**
 * @namespace santos.sapui5productsfe.controller
 */
export default class Details extends BaseController {

    private action: string;
    private formFragments: { [name: string]: Promise<VBox> } = {};

    public onInit(): void {
        const router = this.getRouter() as Router;
        router.getRoute("RouteDetails")?.attachPatternMatched(this.onMatchedObject, this);
    }

    private loadModel(): void {
        const data = {
            product: "",
            productName: "",
            description: "",
            supplier_ID: "",
            category_ID: "",
            subCategory_ID: "",
            stock_code: "",
            rating: 0,
            price: 0,
            currency: "USD"
        }
        this.setModel(new JSONModel(data), "form");
    }

    private onMatchedObject(event: Route$PatternMatchedEvent): void {
        this.loadModel();
        const args = event.getParameter("arguments") as { ID: string; action: string };
        const viewDetails = this.getView() as View;
        const viewModel = this.getModel("view") as JSONModel;
        const viewContainer = viewDetails.getParent()?.getParent() as FlexBox;
        
        viewContainer.setBusy(true);
        this.action = args.action;

        viewDetails.bindElement({
            path: `/ProductsSet(${args.ID})`,
            parameters: {
                $select: "ID,productName,description,supplier_ID,category_ID,subCategory_ID,stock_code,rating,price,currency"
            },
            events: {
                dataRequested: () => {},
                dataReceived: () => {
                    this.toggleEditMode(this.action === "create");
                    viewModel.setProperty("/layout", "TwoColumnsMidExpanded");
                    viewContainer.setBusy(false);
                }
            }
        });
    }

    public onButtonToggleFullScreenPress(): void {
        const viewModel = this.getModel("view") as JSONModel;
        const isFullScreen = viewModel.getProperty("/actionButtonsInfo/midColumn/fullScreen");

        viewModel.setProperty("/layout", isFullScreen ? "TwoColumnsMidExpanded" : "MidColumnFullScreen");
        viewModel.setProperty("/actionButtonsInfo/midColumn/fullScreen", !isFullScreen);
    }

    public onButtonCloseViewDetailsPress(): void {
        const viewModel = this.getModel("view") as JSONModel;
        
        (this.getRouter() as Router).navTo("RouteMaster");
        viewModel.setProperty("/layout", "OneColumn");
        viewModel.setProperty("/actionButtonsInfo/midColumn/fullScreen", false);
    }

    public onButtonEditPress(): void {
        this.toggleEditMode(true);
        const context = this.getView()?.getBindingContext() as Context;
        Utils.copyForm(context, this);
    }

    public onButtonDeletePress(): void {
        this.onButtonCloseViewDetailsPress();
    }

    public async onButtonSavePress(): Promise<void> {
        if (!await this.validateForm()) {
            MessageBox.error(this.getText("vilidateError"))
        }else {
            this.onButtonCloseViewDetailsPress();
        }
    }

    public onButtonCancelPress(): void {
        this.toggleEditMode(false);
    }

    private toggleEditMode(isEditMode: boolean): void {
        const viewModel = this.getModel("view") as JSONModel;
        viewModel.setProperty("/actionButtonsInfo/midColumn/isEditMode", isEditMode);

        void this.showFormFragment(isEditMode ? "Change" : "Display");
    }

    private async showFormFragment(fragmentName: FormFragmentName): Promise<void> {
        const container = this.byId("idformContainerFlexBox") as FlexBox;
        const fragment = await this.getFormFragment(fragmentName);

        container.removeAllItems();
        container.addItem(fragment);

        if (fragmentName === "Change") {
            this.validateForm();
        }
    }

    private getFormFragment(fragmentName: FormFragmentName): Promise<VBox> {
        const view = this.getView() as View;

        return this.formFragments[fragmentName] ??= this.loadFragment({
            id: view.getId(),
            name: `${FRAGMENT_NAMESPACE}.${fragmentName}`
        }) as Promise<VBox>;
    }

    private async validateForm(): Promise<boolean> {
        const vBox = await this.formFragments["Change"] as VBox;
        const aggregation = vBox.getAggregation("items") as Control[];
        const simpleForm = aggregation[0] as SimpleForm;
        const validator = new Validator();
        
        return validator.validate(simpleForm);
    }
}