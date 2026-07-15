import ResourceBundle from "sap/base/i18n/ResourceBundle";
import ComboBox from "sap/m/ComboBox";
import Input from "sap/m/Input";
import RatingIndicator from "sap/m/RatingIndicator";
import TextArea from "sap/m/TextArea";
import UI5Element from "sap/ui/core/Element";
import { ValueState } from "sap/ui/core/library";
import SimpleForm from "sap/ui/layout/form/SimpleForm";
import ResourceModel from "sap/ui/model/resource/ResourceModel";

/**
 * @namespace santos.sapui5productsfe.utils
 */
export default class Validator {

    public static validate(form: SimpleForm): boolean {
        const bundle = (form.getModel("i18n") as ResourceModel).getResourceBundle() as ResourceBundle;
        let isValid = true;

        form.getContent().forEach((control) => {
            if (!this.isValidatable(control)) {
                return;
            }

            // UI5 already rejects values that break the binding type constraints
            // (e.g. minLength/maxLength) and flags the control with ValueState.Error on its own.
            // A rejected value never reaches the model, so treat this as invalid too - otherwise
            // hasValue() below would still see the text the user typed and let it pass.
            if (this.hasTypeError(control)) {
                isValid = false;
                return;
            }

            if (control.getProperty("required") !== true) {
                return;
            }

            if (this.hasValue(control)) {
                this.clearError(control);
            } else {
                this.markError(control, bundle);
                isValid = false;
            }
        });

        return isValid;
    }

    private static isValidatable(control: UI5Element): boolean {
        return control instanceof Input ||
               control instanceof TextArea ||
               control instanceof ComboBox ||
               control instanceof RatingIndicator;
    }

    private static hasTypeError(control: UI5Element): boolean {
        if (control instanceof Input || control instanceof TextArea || control instanceof ComboBox) {
            return control.getValueState() === ValueState.Error;
        }
        return false;
    }

    private static hasValue(control: UI5Element): boolean {
        if (control instanceof ComboBox) {
            return !!control.getSelectedKey();
        }
        if (control instanceof RatingIndicator) {
            return control.getValue() > 0;
        }
        if (control instanceof Input || control instanceof TextArea) {
            return !!control.getValue();
        }
        return true;
    }

    private static markError(control: UI5Element, bundle: ResourceBundle): void {
        if (control instanceof RatingIndicator) {
            control.addStyleClass("ratingError");
            return;
        }
        if (control instanceof Input || control instanceof TextArea || control instanceof ComboBox) {
            control.setValueState(ValueState.Error);
            control.setValueStateText(bundle.getText("requiredFieldError") ?? "Required field");
        }
    }

    private static clearError(control: UI5Element): void {
        if (control instanceof RatingIndicator) {
            control.removeStyleClass("ratingError");
            return;
        }
        if (control instanceof Input || control instanceof TextArea || control instanceof ComboBox) {
            control.setValueState(ValueState.None);
        }
    }
}