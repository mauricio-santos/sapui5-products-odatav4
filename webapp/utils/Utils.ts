import Controller from "sap/ui/core/mvc/Controller";
import ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import Title from "sap/m/Title";
import UIComponent from "sap/ui/core/UIComponent";
import ResourceModel from "sap/ui/model/resource/ResourceModel";
import ResourceBundle from "sap/base/i18n/ResourceBundle";

/**
 * @namespace santos.sapui5productsfe.utils
 */
export default class Utils {
    public refreshProductsCount(bindingList: ODataListBinding, controller: Controller): void {
        const resourseBundle = (((controller.getOwnerComponent() as UIComponent).getModel("i18n") as ResourceModel).getResourceBundle() as ResourceBundle);

        bindingList.requestContexts().then((context) => {
            const length = context.length;
            const title = controller.byId("idCountProductsTitle") as Title;
            title.setText(resourseBundle.getText("productsCount", [length]))
        })
    }

}