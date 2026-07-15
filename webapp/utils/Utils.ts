import ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import Title from "sap/m/Title";
import BaseController from "../controller/BaseController";
import JSONModel from "sap/ui/model/json/JSONModel";
import Context from "sap/ui/model/odata/v4/Context";
import MessageBox from "sap/m/MessageBox";
import ODataModel from "sap/ui/model/odata/v4/ODataModel";
import MessageToast from "sap/m/MessageToast";
import Messaging from "sap/ui/core/Messaging";
import Message from "sap/ui/core/message/Message";
import MessageType from "sap/ui/core/message/MessageType";

/**
 * @namespace santos.sapui5productsfe.utils
 */
export default class Utils {

    // Single deferred update group for every modification. It is configured once on the model
    // (manifest.json -> models."" -> settings.updateGroupId), so create/update/delete and even the
    // table binding all inherit it automatically. Changes are only sent to the backend on
    // submitBatch, and - unlike "$auto" - a failed request rejects instead of being retried
    // forever (which used to freeze the UI on errors such as a duplicate key).
    private static readonly UPDATE_GROUP_ID = "productChanges";

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
        const odataModel = controller.getModel() as ODataModel;
        const data = formModel.getData() as Record<string, unknown>;

        // The new context inherits the model's deferred update group, so nothing is sent yet.
        const listBinding = odataModel.bindList("/ProductsSet");
        const context = listBinding.create({ ID: id, ...data });
        // The create only reaches the backend on submitChanges below. Swallow this promise so a
        // later resetChanges() (on failure) does not raise an unhandled rejection.
        context.created()?.catch(() => undefined);

        return this.submitChanges(controller);
    }

    public static async updateProduct(controller: BaseController, context: Context, formModel: JSONModel): Promise<boolean> {
        if (!(await this.confirm(controller))) {
            return false;
        }

        const data = formModel.getData() as Record<string, unknown>;
        Object.keys(data).forEach((property) => {
            context.setProperty(property, data[property]).catch(() => undefined);
        });

        return this.submitChanges(controller);
    }

    public static async deleteProduct(controller: BaseController, context: Context): Promise<boolean> {
        if (!(await this.confirm(controller))) {
            return false;
        }

        context.delete().catch(() => undefined);

        return this.submitChanges(controller);
    }

    /**
     * Submits all pending changes of the shared update group and reports the outcome.
     *
     * submitBatch always resolves - a failed change (e.g. duplicate key) is reported via the
     * message model and kept queued for automatic retry, it never rejects the promise. So instead
     * of awaiting the change promise (which would hang forever) we submit and then check whether
     * the group still has pending changes: if it does, the request failed.
     */
    private static async submitChanges(controller: BaseController): Promise<boolean> {
        const view = controller.getView();
        const odataModel = controller.getModel() as ODataModel;

        view?.setBusy(true);
        try {
            await odataModel.submitBatch(this.UPDATE_GROUP_ID);

            if (odataModel.hasPendingChanges(this.UPDATE_GROUP_ID)) {
                odataModel.resetChanges(this.UPDATE_GROUP_ID);
                this.showError(controller);
                return false;
            }

            odataModel.refresh();
            MessageToast.show(controller.getText("operationSuccess"));
            return true;
        } catch {
            odataModel.resetChanges(this.UPDATE_GROUP_ID);
            this.showError(controller);
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

    private static showError(controller: BaseController): void {
        // Read the concrete backend errors (e.g. "Entity already exists") from the message model,
        // then clear them so they do not pile up or reappear on the next operation.
        const errorMessages = (Messaging.getMessageModel().getData() as Message[])
            .filter((message) => message.getType() === MessageType.Error);
        const details = errorMessages.map((message) => message.getMessage()).join("\n");
        Messaging.removeMessages(errorMessages);

        MessageBox.error(controller.getText("operationError"), details ? { details } : {});
    }
}