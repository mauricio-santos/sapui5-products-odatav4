import Controller from "sap/ui/core/mvc/Controller";
import UIComponent from "sap/ui/core/UIComponent";
import Model from "sap/ui/model/Model";
import Router from "sap/ui/core/routing/Router";
import ResourceBundle from "sap/base/i18n/ResourceBundle";
import ResourceModel from "sap/ui/model/resource/ResourceModel";

/**
 * @namespace santos.sapui5productsfe.controller
 */
export default class BaseController extends Controller {
    public getModel(modelName?: string): Model | undefined {
        return this.getView()?.getModel(modelName);
    }

    public setModel(model: Model, modelName?: string): void {
        this.getView()?.setModel(model, modelName);
    }

    public getOwnerComponent(): UIComponent {
        return super.getOwnerComponent() as UIComponent;
    }

    private getResourceBundle(): ResourceBundle | Promise<ResourceBundle> {
        const resourceModel = this.getOwnerComponent().getModel("i18n") as ResourceModel;
        return resourceModel.getResourceBundle();
    }

    public getText(key: string, parameters?: (string | number)[]): string {
        const bundle = this.getResourceBundle() as ResourceBundle;
        return bundle.getText(key, parameters) ?? key;
    }

    public getRouter(): Router {
        return this.getOwnerComponent().getRouter();
    }
}