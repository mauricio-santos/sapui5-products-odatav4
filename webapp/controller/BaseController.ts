import Controller from "sap/ui/core/mvc/Controller";
import UIComponent from "sap/ui/core/UIComponent";
import Model from "sap/ui/model/Model";
import View from "sap/ui/core/mvc/View";
import Router from "sap/ui/core/routing/Router";
import ResourceBundle from "sap/base/i18n/ResourceBundle";
import ResourceModel from "sap/ui/model/resource/ResourceModel";

/**
 * @namespace santos.sapui5productsfe.controller
 */
export default class BaseController extends Controller {

    public getModel(modelName?: string): Model | undefined {
        return (this.getView() as View)?.getModel(modelName);
    }

    public setModel(model: Model, modelName?: string): void {
        (this.getView() as View)?.setModel(model, modelName);
    }

    public getText(text: string, parameters?: any[]): string | undefined {
        return (((this.getOwnerComponent() as UIComponent).getModel("i18n") as ResourceModel).getResourceBundle() as ResourceBundle).getText(text, parameters);
    }

    public getRouter(): Router {
        return (this.getOwnerComponent() as UIComponent).getRouter();
    }
}