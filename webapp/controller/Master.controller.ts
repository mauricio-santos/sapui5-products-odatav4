import BaseController from "./BaseController";
import Control from "sap/ui/core/Control";
import { FilterBar$SearchEvent } from "sap/ui/comp/filterbar/FilterBar";
import FilterGroupItem from "sap/ui/comp/filterbar/FilterGroupItem";
import Input from "sap/m/Input";
import RatingIndicator from "sap/m/RatingIndicator";
import RangeSlider from "sap/m/RangeSlider";
import ComboBox from "sap/m/ComboBox";
import Table from "sap/m/Table";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import FilterType from "sap/ui/model/FilterType";
import ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";

/**
 * @namespace santos.sapui5productsfe.controller
 */
export default class Master extends BaseController {

    public onInit(): void {

    }

    public onFilterBarSearch(event: FilterBar$SearchEvent): void {
        const selectionSet = (event.getParameter("selectionSet") ?? []) as Control[];

        const filters = selectionSet
            .map((control) => this.buildFilter(control))
            .filter((filter): filter is Filter => filter !== null);

        const table = this.byId("idProductsSetTable") as Table;
        const binding = table.getBinding("items") as ODataListBinding;

        binding.filter(filters, FilterType.Application);
    }

    private buildFilter(control: Control): Filter | null {
        const parent = control.getParent();
        if (!(parent instanceof FilterGroupItem)) {
            return null;
        }
        const path = parent.getName();

        if (control instanceof Input) {
            const value = control.getValue().trim();
            return value ? new Filter(path, FilterOperator.Contains, value) : null;
        }

        if (control instanceof ComboBox) {
            const key = control.getSelectedKey();
            return key ? new Filter(path, FilterOperator.EQ, key) : null;
        }

        if (control instanceof RatingIndicator) {
            const rating = control.getValue();
            return rating > 0 ? new Filter(path, FilterOperator.EQ, rating) : null;
        }

        if (control instanceof RangeSlider) {
            const min = control.getValue();
            const max = control.getValue2();
            return new Filter(path, FilterOperator.BT, min, max);
        }

        return null;
    }
}
