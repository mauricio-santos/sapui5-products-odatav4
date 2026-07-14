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

        return new Promise<void | string>((resolve, reject) => {
            MessageBox.confirm(controller.getText("sureOperation"), {
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                emphasizedAction: MessageBox.Action.YES,
                onClose: async (actionButton): Promise<void | string> => {
                    if (actionButton === MessageBox.Action.YES) {
                        try {
                            switch (action) {
                                case "update": await this.update(controller, bindingContext, model); break;
                                case "delete": await this.delete(controller, bindingContext); break;
                            }
                        } catch (error) {
                            reject(error);
                        }
                    }
                    resolve();
                }
            });
        });
    }

    private static async create(controller: BaseController): Promise<string> {
        const odataModel = controller.getModel() as ODataModel;
        const bindList = odataModel.bindList("/ProductsSet") as ODataListBinding;
        const newContext = bindList.create() as Context;

        await newContext.created();
        this.refreshModel(controller);
        return newContext.getProperty("ID") as string;
    }

    private static async update(controller: BaseController, bindingContext?: Context, model?: JSONModel): Promise<void> {
        const view = controller.getView();
        view?.setBusy(true);

        return new Promise<void>(async (resolve, reject) => {
            try {
                await bindingContext?.setProperty("product", model?.getProperty("/product"));
                await bindingContext?.setProperty("productName", model?.getProperty("/productName"));
                await bindingContext?.setProperty("description", model?.getProperty("/description"));
                await bindingContext?.setProperty("supplier_ID", model?.getProperty("/supplier_ID"));
                await bindingContext?.setProperty("category_ID", model?.getProperty("/category_ID"));
                await bindingContext?.setProperty("subCategory_ID", model?.getProperty("/subCategory_ID"));
                await bindingContext?.setProperty("stock_code", model?.getProperty("/stock_code"));
                await bindingContext?.setProperty("rating", model?.getProperty("/rating"));
                await bindingContext?.setProperty("price", model?.getProperty("/price"));
                await bindingContext?.setProperty("currency", "USD");

                this.refreshModel(controller);
                view?.setBusy(false);
                resolve();
            }catch (error) {
                reject(error);
            }
        });
    }

    private static async delete(controller: BaseController, bindingContext?: Context): Promise<void> {

    }

    private static refreshModel(controller: BaseController): void {
        const odataModel = controller.getModel() as ODataModel;
        odataModel.refresh();
    }
}