import BaseController from "./BaseController";
import Control from "sap/ui/core/Control";
import { FilterBar$ClearEvent, FilterBar$SearchEvent } from "sap/ui/comp/filterbar/FilterBar";
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
import Utils from "../utils/Utils";
import { ListBase$ItemPressEvent } from "sap/m/ListBase";
import ColumnListItem from "sap/m/ColumnListItem";
import Context from "sap/ui/model/odata/v4/Context";

/**
 * @namespace santos.sapui5productsfe.controller
 */
export default class Master extends BaseController {

    public onFilterBarSearch(event: FilterBar$SearchEvent): void {
        const selectionSet = (event.getParameter("selectionSet") ?? []);

        const filters = selectionSet
            .map((control) => this.buildFilter(control))
            .filter((filter): filter is Filter => filter !== null);

        this.applyFilters(filters);
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

    private applyFilters(filters: Filter[]): void {
        const table = this.byId("idProductsSetTable") as Table;
        const binding = table.getBinding("items") as ODataListBinding;

        binding.filter(filters, FilterType.Application);

        void Utils.refreshProductsCount(binding, this);
    }

    public onFilterBarClear(event: FilterBar$ClearEvent): void {
        const selectionSet = (event.getParameter("selectionSet") ?? []);
        selectionSet.forEach((control) => this.clearControl(control));
        this.applyFilters([]);
    }

    private clearControl(control: Control): void {
        if (control instanceof Input) {
            control.setValue("");
            return;
        }
        if (control instanceof ComboBox) {
            control.setSelectedKey("");
            return;
        }
        if (control instanceof RatingIndicator) {
            control.setValue(0);
            return;
        }
        if (control instanceof RangeSlider) {
            control.setValue(control.getMin(), {});
            control.setValue2(control.getMax());
        }
    }

    public navToDetails(event: ListBase$ItemPressEvent) : void {
        const table = event.getSource();
        const item = table.getSelectedItem() as ColumnListItem;
        const id = (item.getBindingContext() as Context).getProperty("ID");

        this.getRouter().navTo("RouteDetails", {
            "ID": id,
            "action": "edit"
        });
    }

    public onCreateButtonPress(): void {
        // Reserve an id on the client so navigation is instant; the product is only
        // persisted in the backend once the user presses Save on the Details page.
        const id = crypto.randomUUID();

        this.getRouter().navTo("RouteDetails", {
            "ID": id,
            "action": "create"
        });
    }
}
