import BaseController from "./BaseController";
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
import { ODataContextBinding$DataReceivedEvent } from "sap/ui/model/odata/v4/ODataContextBinding";

type FormFragmentName = "Display" | "Change";
type DetailsAction = "create" | "edit";

/**
 * @namespace santos.sapui5productsfe.controller
 */
export default class Details extends BaseController {

    private static readonly FRAGMENT_NAMESPACE = "santos.sapui5productsfe.fragments";

    private action: DetailsAction;
    // ID reserved on the client for a product that is being created but not yet saved.
    private draftId = "";
    private formFragments: { [name: string]: Promise<VBox> } = {};

    public onInit(): void {
        this.getRouter().getRoute("RouteDetails")?.attachPatternMatched((event) => this.onMatchedObject(event));
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
        };
        this.setModel(new JSONModel(data), "form");
    }

    private onMatchedObject(event: Route$PatternMatchedEvent): void {
        this.loadModel();
        const args = event.getParameter("arguments") as { ID: string; action: string };
        const viewModel = this.getModel("view") as JSONModel;

        this.action = args.action as DetailsAction;
        viewModel.setProperty("/layout", "TwoColumnsMidExpanded");

        if (this.action === "create") {
            // Nothing is sent to the backend yet: the product only becomes real when Save is pressed.
            // This avoids leaving an empty product behind if the user navigates away.
            this.draftId = args.ID;
            this.toggleEditMode(true);
            return;
        }

        this.bindProduct(args.ID);
    }

    private bindProduct(id: string): void {
        const viewDetails = this.getView() as View;
        const viewContainer = viewDetails.getParent()?.getParent() as FlexBox;

        viewContainer.setBusy(true);

        viewDetails.bindElement({
            path: `/ProductsSet(${id})`,
            parameters: {
                $select: "ID,product,productName,description,supplier_ID,category_ID,subCategory_ID,stock_code,rating,price,currency"
            },
            events: {
                dataReceived: (event: ODataContextBinding$DataReceivedEvent) => {
                    viewContainer.setBusy(false);

                    // dataReceived also fires on failure (e.g. product not found): notify and go back.
                    if (event.getParameter("error")) {
                        MessageBox.error(this.getText("loadError"));
                        this.onButtonCloseViewDetailsPress();
                        return;
                    }

                    this.toggleEditMode(false);
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

        this.getRouter().navTo("RouteMaster");
        viewModel.setProperty("/layout", "OneColumn");
        viewModel.setProperty("/actionButtonsInfo/midColumn/fullScreen", false);
    }

    public onButtonEditPress(): void {
        this.toggleEditMode(true);
        const context = this.getView()?.getBindingContext() as Context;
        Utils.copyForm(context, this);
    }

    public async onButtonDeletePress(): Promise<void> {
        const context = this.getView()?.getBindingContext() as Context;
        const deleted = await Utils.deleteProduct(this, context);
        if (!deleted) {
            return;
        }

        this.onButtonCloseViewDetailsPress();
    }

    public async onButtonSavePress(): Promise<void> {
        if (!(await this.validateForm())) {
            MessageBox.error(this.getText("validationError"));
            return;
        }

        const formModel = this.getModel("form") as JSONModel;

        if (this.action === "create") {
            const created = await Utils.createProduct(this, this.draftId, formModel);
            if (created) {
                this.action = "edit";
                this.bindProduct(this.draftId);
            }
            return;
        }

        const context = this.getView()?.getBindingContext() as Context;
        const updated = await Utils.updateProduct(this, context, formModel);
        if (updated) {
            this.action = "edit";
        }
    }

    public onButtonCancelPress(): void {
        if (this.action === "create") {
            this.onButtonCloseViewDetailsPress();
            return;
        }
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
    }

    private getFormFragment(fragmentName: FormFragmentName): Promise<VBox> {
        const view = this.getView() as View;

        this.formFragments[fragmentName] ??= this.loadFragment({
            id: view.getId(),
            name: `${Details.FRAGMENT_NAMESPACE}.${fragmentName}`
        }) as Promise<VBox>;

        return this.formFragments[fragmentName];
    }

    private async validateForm(): Promise<boolean> {
        const vBox = await this.formFragments.Change;
        const aggregation = vBox.getAggregation("items") as Control[];
        const simpleForm = aggregation[0] as SimpleForm;

        return Validator.validate(simpleForm);
    }
}