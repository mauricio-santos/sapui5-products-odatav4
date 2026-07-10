import BaseController from "./BaseController";
import JSONModel from "sap/ui/model/json/JSONModel";

/**
 * @namespace santos.sapui5productsfe.controller
 */
export default class Container extends BaseController {

    onInit(): void {
        this.initViewModel();
    }
    
    private initViewModel(): void {
        const model = new JSONModel({
            layout: "OneColumn"
        })
        this.setModel(model, "view");
    }

}