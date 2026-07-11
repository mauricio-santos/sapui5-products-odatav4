import BaseController from "./BaseController"
import Router from "sap/ui/core/routing/Router"
import { Route$PatternMatchedEvent } from "sap/ui/core/routing/Route";
import View from "sap/ui/core/mvc/View";
import JSONModel from "sap/ui/model/json/JSONModel";

/**
 * @namespace santos.sapui5productsfe.controller
 */
export default class Details extends BaseController {
    public onInit(): void | undefined {
        const router = this.getRouter() as Router;
        router.getRoute("RouteDetails")?.attachPatternMatched(this.onMatchedObject, this);
    }

    private onMatchedObject(event: Route$PatternMatchedEvent): void {
        const id = (event.getParameter("arguments") as { ID: string }).ID;
        const view = this.getView() as View;
        const bindingPath = `/ProductsSet(${id})`;
        const viewModel = this.getModel("view") as JSONModel

        id && viewModel.setProperty("/layout", "TwoColumnsMidExpanded");
        view.bindElement(bindingPath);
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

    
}