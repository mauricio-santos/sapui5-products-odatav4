import ResourceBundle from 'sap/base/i18n/ResourceBundle';
import ComboBox from 'sap/m/ComboBox';
import Input from 'sap/m/Input';
import RatingIndicator from 'sap/m/RatingIndicator';
import Select from 'sap/m/Select';
import TextArea from 'sap/m/TextArea';
import { ValueState } from 'sap/ui/core/library';
import SimpleForm from 'sap/ui/layout/form/SimpleForm';
import ResourceModel from 'sap/ui/model/resource/ResourceModel';

/**
 * @namespace santos.sapui5productsfe.utils
 */

export default class Validator {

    private isValid : boolean;

    constructor () {
        this.isValid = true;
    }

    public validate (simpleForm : SimpleForm) : boolean {
        this.validateForm(simpleForm);
        return this.isValid;
    } 

    private validateForm(form: SimpleForm): void {
        const controls = form.getContent();
        const resourceBundle = (form.getModel("i18n") as ResourceModel).getResourceBundle() as ResourceBundle;

        controls.forEach(control => {
            if (this.isValidatable(control)) {
                const value = this.getControlValue(control);
                
                if (!value) {
                    if (control instanceof RatingIndicator) {
                        control.addStyleClass("ratingError");
                        this.isValid = false;
                    } else {
                        (control as Input | TextArea | ComboBox | Select ).setValueState(ValueState.Error);
                        (control as Input | TextArea | ComboBox | Select ).setValueStateText(resourceBundle.getText("requiredFieldError") || "Required field");
                        this.isValid = false;
                    }

                } else if (control instanceof RatingIndicator) {
                    control.removeStyleClass("ratingError");
                } else {
                    (control as Input | TextArea | ComboBox | Select ).setValueState(ValueState.None);
                }
            }
        });
    }

    private isValidatable(control: any): boolean {
        return control instanceof Input ||
               control instanceof TextArea ||
               control instanceof ComboBox ||
               control instanceof RatingIndicator;
    }

    private getControlValue(control: any): string | number | null {
        if (control instanceof Input || control instanceof TextArea || control instanceof RatingIndicator) {
            return control.getValue();
        } else if (control instanceof ComboBox) {
            return control.getSelectedKey();
        }
        return null;
    }
}