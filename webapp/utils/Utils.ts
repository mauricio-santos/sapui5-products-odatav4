import ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import Title from "sap/m/Title";
import BaseController from "../controller/BaseController";
import JSONModel from "sap/ui/model/json/JSONModel";
import Context from "sap/ui/model/odata/v4/Context";
import MessageBox from "sap/m/MessageBox";
import ODataModel from "sap/ui/model/odata/v4/ODataModel";
import MessageToast from "sap/m/MessageToast";

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

        // Read each field explicitly instead of spreading context.getObject(): the Display
        // fragment binds navigation properties (supplier, category, subCategory, stock) on the
        // same context, so autoExpandSelect expands them and getObject() would include them as
        // nested objects. Copying those into the form would later break updateProduct, since
        // OData v4 rejects setProperty calls made with a non-primitive value.
        formModel.setData({
            product: context.getProperty("product"),
            productName: context.getProperty("productName"),
            description: context.getProperty("description"),
            supplier_ID: context.getProperty("supplier_ID"),
            category_ID: context.getProperty("category_ID"),
            subCategory_ID: context.getProperty("subCategory_ID"),
            stock_code: context.getProperty("stock_code"),
            rating: context.getProperty("rating"),
            price: context.getProperty("price"),
            currency: context.getProperty("currency")
        });
    }

    public static async createProduct(controller: BaseController, id: string, formModel: JSONModel): Promise<boolean> {
        const view = controller.getView();
        const odataModel = controller.getModel() as ODataModel;
        const listBinding = odataModel.bindList("/ProductsSet");
        const data = formModel.getData() as Record<string, unknown>;
        const context = listBinding.create({ ID: id, ...data });

        view?.setBusy(true);
        try {
            await context.created();
            odataModel.refresh();
            MessageToast.show(controller.getText("operationSuccess"));
            return true;
        } catch (error) {
            // The POST failed: discard the transient entry so a retry starts from a clean state.
            await listBinding.resetChanges();
            this.showError(controller, error);
            return false;
        } finally {
            view?.setBusy(false);
        }
    }

    public static async updateProduct(controller: BaseController, context: Context, formModel: JSONModel): Promise<boolean> {
        if (!(await this.confirm(controller))) {
            return false;
        }

        const view = controller.getView();
        const odataModel = controller.getModel() as ODataModel;
        view?.setBusy(true);
        try {
            const data = formModel.getData() as Record<string, unknown>;
            await Promise.all(
                Object.keys(data).map((property) => context.setProperty(property, data[property]))
            );

            odataModel.refresh();
            MessageToast.show(controller.getText("operationSuccess"));
            return true;
        } catch (error) {
            // Revert the pending property changes so the form reflects the server state again.
            odataModel.resetChanges();
            this.showError(controller, error);
            return false;
        } finally {
            view?.setBusy(false);
        }
    }

    public static async deleteProduct(controller: BaseController, context: Context): Promise<boolean> {
        if (!(await this.confirm(controller))) {
            return false;
        }

        const view = controller.getView();
        view?.setBusy(true);
        try {
            await context.delete();
            (controller.getModel() as ODataModel).refresh();
            return true;
        } catch (error) {
            this.showError(controller, error);
            return false;
        } finally {
            view?.setBusy(false);
        }
    }

    private static confirm(controller: BaseController): Promise<boolean> {
        return new Promise((resolve) => {
            MessageBox.confirm(controller.getText("sureOperation"), {
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                emphasizedAction: MessageBox.Action.YES,
                onClose: (action) => resolve(action === MessageBox.Action.YES)
            });
        });
    }

    private static showError(controller: BaseController, error: unknown): void {
        const details = error instanceof Error ? error.message : String(error);
        MessageBox.error(controller.getText("operationError"), { details });
    }
}