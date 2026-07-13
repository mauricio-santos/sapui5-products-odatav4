import ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import Title from "sap/m/Title";
import BaseController from "../controller/BaseController";
import JSONModel from "sap/ui/model/json/JSONModel";
import Context from "sap/ui/model/odata/v4/Context";

/**
 * @namespace santos.sapui5productsfe.utils
 */
export default class Utils {

    public static async refreshProductsCount(binding: ODataListBinding, controller: BaseController): Promise<void> {
        const title = controller.byId("idCountProductsTitle") as Title;
        const contexts = await binding.requestContexts();
        title.setText(controller.getText("productsCount", [contexts.length]));
    }

    public static copyForm(context: Context, controller: BaseController): void {
        const formModel = controller.getModel("form") as JSONModel;
        const data = context.getObject();       
        formModel.setData(data);
    }
}