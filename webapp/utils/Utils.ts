import ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import Title from "sap/m/Title";
import BaseController from "../controller/BaseController";
import JSONModel from "sap/ui/model/json/JSONModel";
import Context from "sap/ui/model/odata/v4/Context";
import MessageBox from "sap/m/MessageBox";
import ODataModel from "sap/ui/model/odata/v4/ODataModel";

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

    public static async crud(controller: BaseController, action: string, bindingContext?: Context, model?: JSONModel): Promise<void | string> {

        if (action === "create") {
            return await this.create(controller);
        }

        MessageBox.confirm(controller.getText("sureOperation"), {
            actions: [MessageBox.Action.YES, MessageBox.Action.NO],
            emphasizedAction: MessageBox.Action.YES,
            onClose: async (actionButton): Promise<void | string> => {
                if (actionButton === MessageBox.Action.YES) {
                    switch (action) {
                        case "update": return await this.update(controller, bindingContext, model);
                        case "delete": return await this.delete(controller, bindingContext);
                    }
                }
            }
        });
    }

    private static async create(controller: BaseController): Promise<string> {
        const odataModel = controller.getModel() as ODataModel;
        const bindList = odataModel.bindList("/ProductsSet") as ODataListBinding;
        const newContext = bindList.create() as Context;

        await newContext.created();
        return newContext.getProperty("ID") as string;
    }

    private static async update(controller: BaseController, bindingContext?: Context, model?: JSONModel): Promise<void> {

    }

    private static async delete(controller: BaseController, bindingContext?: Context): Promise<void> {

    }
}