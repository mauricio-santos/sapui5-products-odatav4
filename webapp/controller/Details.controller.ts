import BaseController from "./BaseController";
import Router from "sap/ui/core/routing/Router";
import { Route$PatternMatchedEvent } from "sap/ui/core/routing/Route";
import View from "sap/ui/core/mvc/View";
import JSONModel from "sap/ui/model/json/JSONModel";
import FlexBox from "sap/m/FlexBox";
import VBox from "sap/m/VBox";

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

    private onMatchedObject(event: Route$PatternMatchedEvent): void {
        const args = event.getParameter("arguments") as { ID: string; action: string };
        const view = this.getView() as View;
        const viewModel = this.getModel("view") as JSONModel;

        this.action = args.action;

        viewModel.setProperty("/layout", "TwoColumnsMidExpanded");

        view.bindElement({
            path: `/ProductsSet(${args.ID})`,
            parameters: {
                $select: "ID,productName,description,supplier_ID,category_ID,subCategory_ID,stock_code,rating,price,currency"
            },
            events: {
                dataRequested: () => view.setBusy(true),
                dataReceived: () => {
                    view.setBusy(false);
                    this.toggleEditMode(this.action === "create");
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
    }

    public onButtonDeletePress(): void {
        this.onButtonCloseViewDetailsPress();
    }

    public onButtonSavePress(): void {
        this.toggleEditMode(false);
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
    }

    private getFormFragment(fragmentName: FormFragmentName): Promise<VBox> {
        const view = this.getView() as View;

        return this.formFragments[fragmentName] ??= this.loadFragment({
            id: view.getId(),
            name: `${FRAGMENT_NAMESPACE}.${fragmentName}`
        }) as Promise<VBox>;
    }
}