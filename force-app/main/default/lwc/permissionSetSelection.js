import { LightningElement, track, wire, api } from 'lwc';
import getPermissionSetList from '@salesforce/apex/UserPermissionController.getPermissionSetList';
import getPermissionRuleRelatedRecords from '@salesforce/apex/UserPermissionController.getPermissionRuleRelatedRecords';

import { createRecord, updateRecord } from 'lightning/uiRecordApi';
import { getRecords } from 'lightning/uiRecordApi';
import { getListUi } from 'lightning/uiListApi';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from "lightning/platformShowToastEvent";

import USER_CRITERIA_CONDITION_FIELD from "@salesforce/schema/UserPermissionRule__c.User_Criteria_Condition__c";
import ID_FIELD from "@salesforce/schema/UserPermissionRule__c.Id";

import USER_CRITERIA_OBJECT from '@salesforce/schema/UserCriteria__c';
import USER_CRITERIA_NAME_FIELD from '@salesforce/schema/UserCriteria__c.Name';
import CRITERIA_NUMBER_FIELD from '@salesforce/schema/UserCriteria__c.Criteria_Number__c';
import USER_FIELD_NAME from '@salesforce/schema/UserCriteria__c.User_Field_Name__c';
import OPERATOR_FIELD from '@salesforce/schema/UserCriteria__c.Operator__c';
import VALUE_FIELD from '@salesforce/schema/UserCriteria__c.Value__c';
import CRITERIA_USER_PERMISSION_RULE from '@salesforce/schema/UserCriteria__c.User_Permission_Rule__c';


import PERMISSION_SET_OBJECT from '@salesforce/schema/User_Permission_Set__c';
import NAME_FIELD from '@salesforce/schema/User_Permission_Set__c.Name';
import PERMISSION_SET_API_NAME_FIELD from '@salesforce/schema/User_Permission_Set__c.User_Permission_Set_Api_Name__c';
import SET_USER_PERMISSION_RULE from '@salesforce/schema/User_Permission_Set__c.User_Permission_Rule__c';

import USER_GROUP_OBJECT from '@salesforce/schema/UserGroup__c';
import USER_GROUP_NAME_FIELD from '@salesforce/schema/UserGroup__c.Name';
import USER_GROUP_API_NAME_FIELD from '@salesforce/schema/UserGroup__c.User_Group_Api_Name__c';
import GROUP_USER_PERMISSION_RULE from '@salesforce/schema/UserGroup__c.User_Permission_Rule__c';

import USER_PERMISSION_SET_GROUP_OBJECT from '@salesforce/schema/UserPermissionSetGroup__c';
import USER_PERMISSION_SET_GROUP_NAME_FIELD from '@salesforce/schema/UserPermissionSetGroup__c.Name';
import USER_PERMISSION_SET_GROUP_API_NAME_FIELD from '@salesforce/schema/UserPermissionSetGroup__c.User_Permission_Set_Group_Api_Name__c';
import SETGROUP_USER_PERMISSION_RULE from '@salesforce/schema/UserPermissionSetGroup__c.User_Permission_Rule__c';

import Manage_Package_License_OBJECT from '@salesforce/schema/Manage_Package_License__c';
import Manage_Package_License_FIELD from '@salesforce/schema/Manage_Package_License__c.Name';
import PACKAGE_USER_PERMISSION_RULE from '@salesforce/schema/Manage_Package_License__c.User_Permission_Rule__c';

export default class PermissionSetSelection extends NavigationMixin(LightningElement) {

    @track permissionSetvalues = []; // Stores available permission sets
    @track selectedValues = []; // Stores selected permission sets
    @track selectedLabels = []; // Stores selected permission sets
    @track permissionSetGroupValues = [];
    @track permissionSetGroupLabels = [];
    @track publicGroupValues = []
    @track publicGroupLabels = []
    @track managePackageValues = [];
    @track managePackageLabels = [];
    isValueNotSelected = true;
    @api criteriaList
    @api ruleRecordId
    @api conditionLogic
    @track error
    @track rules = [];

    @track createdPermissionSetValues = []
    @track createdPermissionSetLabels = []
    @track createdPermissionSetIds = []


    @wire(getPermissionRuleRelatedRecords, {
        permissionRuleId: "$ruleRecordId"
    })
    wiredRules({ error, data }) {
        if (data) {
            this.rules = data;
            this.rules.forEach(rule => {
                console.log('records', JSON.stringify(rule.User_Permission_Sets__r));
                if (rule.User_Permission_Sets__r) {
                    rule.User_Permission_Sets__r.forEach(permissionSet => {
                        this.createdPermissionSetValues.push(permissionSet.User_Permission_Set_Api_Name__c)
                        this.createdPermissionSetLabels.push(permissionSet.Name)
                        this.createdPermissionSetIds.push(permissionSet.Id)
                        console.log('this.createdPermissionSetValues:', JSON.stringify(this.createdPermissionSetValues));
                        console.log('this.createdPermissionSetLabels:', JSON.stringify(this.createdPermissionSetLabels));
                        console.log('this.createdPermissionSetIds:', JSON.stringify(this.createdPermissionSetIds));
                        console.log('selected values on wire', JSON.stringify(this.selectedValues));
                        console.log('public group inside wire', JSON.stringify(this.publicGroupValues));
                        this.checkValuesSelection();
                    });
                }

            })
            console.log('rules', JSON.stringify(this.rules))
        } else if (error) {
            console.error(error);
        }
    }

    connectedCallback() {
        console.log('userPermissionRuleId', this.ruleRecordId);
        console.log('CriteriaList', JSON.stringify(this.criteriaList));
        console.log('conditionLogic', this.conditionLogic);
        if (this.createdPermissionSetValues != null && this.createdPermissionSetLabels != null) {
            console.log('created values on load', JSON.stringify(this.createdPermissionSetValues));
            console.log('selected values on load', JSON.stringify(this.selectedValues));
            this.selectedValues = this.createdPermissionSetValues;
            this.selectedLabels = this.createdPermissionSetLabels;
        }
    }

    handleValuesOnLoad(event) {
        console.log('grp values on load', JSON.stringify(event.detail.values))
        console.log('grp labels on load', JSON.stringify(event.detail.labels))

    }

    handleChange(event) {
        this.selectedValues = event.detail.value;
        this.selectedLabels = this.selectedValues.map(option => this.options.find(o => o.value === option).label);
        const merged = [...this.selectedLabels, ...this.selectedValues]
        this.checkValuesSelection();
        console.log('Selected values:', JSON.stringify(this.selectedValues));
        console.log('selectedLabels:', JSON.stringify(this.selectedLabels));
        console.log('merged:', JSON.stringify(merged));
    }

    handlePackageValuesSelection(event) {
        this.managePackageValues = event.detail.ApiName;
        this.managePackageLabels = event.detail.Name;
        this.checkValuesSelection();
        console.log('manage package values', JSON.stringify(this.managePackageValues));
        console.log('manage package lables', JSON.stringify(this.managePackageLabels));

    }

    handlePermissionSetGroupValuesSelection(event) {
        this.permissionSetGroupValues = event.detail.ApiName;
        this.permissionSetGroupLabels = event.detail.Name;
        this.checkValuesSelection();
        console.log('permission set group values', JSON.stringify(this.permissionSetGroupValues));
        console.log('permission set group lables', JSON.stringify(this.permissionSetGroupLabels));

    }

    handlePublicGroupValuesSelection(event) {
        this.publicGroupValues = event.detail.ApiName;
        this.publicGroupLabels = event.detail.Name;
        this.checkValuesSelection();
        console.log('public group values', JSON.stringify(this.publicGroupValues));
        console.log('public group lables', JSON.stringify(this.publicGroupLabels));

    }

    checkValuesSelection() {
        if (this.selectedValues.length === 0 && this.publicGroupValues.length === 0 && this.permissionSetGroupValues.length === 0 && this.managePackageValues.length === 0) {
            this.isValueNotSelected = true;
        }

        else {
            this.isValueNotSelected = false;
        }
    }

    get options() {

        getPermissionSetList({})
            .then(result => {
                this.permissionSetvalues = result.map(element => ({
                    value: element.Name,
                    label: element.Label
                }));
            })
            .catch(error => {
                this.error = error;
                console.error('Error fetching permission sets:', error.body?.message || error);
            });

        console.log('values', JSON.stringify(this.permissionSetvalues));
        return this.permissionSetvalues;
    }

    handleUserPermissionRuleUpdate() {
        const fields = {};
        fields[ID_FIELD.fieldApiName] = this.ruleRecordId;
        fields[USER_CRITERIA_CONDITION_FIELD.fieldApiName] = this.conditionLogic;
        const recordInput = { fields };

        updateRecord(recordInput).then(() => {
            console.log('Updated Record', JSON.stringify(recordInput));
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'User Permission Rule Record is updated successfully!',
                    variant: 'success'
                })
            );
        })
            .catch((error) => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error updating record',
                        message: error.body.message,
                        variant: 'error'
                    })
                );
            });
    }


    handlePermissions() {
        const createRecordPromises = [];

        console.log('final selected', JSON.stringify(this.selectedValues))
        console.log('original selected', JSON.stringify(this.createdPermissionSetValues));

        const commonValues = this.selectedValues.filter(value =>
            this.createdPermissionSetValues.includes(value)
        );
        console.log('common values', JSON.stringify(commonValues));

        const retainedValues = this.createdPermissionSetValues.filter(value =>
            this.selectedValues.includes(value)
        );

        // Find values that were removed from selectedValues
        const removedValues = this.createdPermissionSetValues.filter(value =>
            !this.selectedValues.includes(value)
        );

        console.log('Retained Values:', JSON.stringify(retainedValues)); // Still present in selectedValues
        console.log('Removed Values:', JSON.stringify(removedValues));   // No longer in selectedValues


        // this.selectedValues = this.selectedValues.filter(value =>
        //     !commonValues.includes(value)
        // );

        // console.log('Updated selectedValues:', JSON.stringify(this.selectedValues));

        //     this.selectedValues.forEach((permissionSetApiName, index) => {
        //         const permissionSetName = this.selectedLabels[index]; // Get the corresponding label

        //         if (permissionSetName) { // Ensure it's valid
        //             console.log(`Creating record for: ${permissionSetName}`);

        //             const fields = {};
        //             fields[NAME_FIELD.fieldApiName] = permissionSetName;
        //             fields[PERMISSION_SET_API_NAME_FIELD.fieldApiName] = permissionSetApiName;
        //             fields[SET_USER_PERMISSION_RULE.fieldApiName] = this.ruleRecordId;

        //             const recordInput = { apiName: PERMISSION_SET_OBJECT.objectApiName, fields };
        //             createRecordPromises.push(createRecord(recordInput));
        //         }
        //     });

        //     this.publicGroupValues.forEach((publicGroupApiName, index) => {
        //         const publicGroupName = this.publicGroupLabels[index]; // Get the corresponding label

        //         if (publicGroupName) { // Ensure it's valid
        //             console.log(`Creating record for: ${publicGroupName}`);

        //             const fields = {};
        //             fields[USER_GROUP_NAME_FIELD.fieldApiName] = publicGroupName;
        //             fields[GROUP_USER_PERMISSION_RULE.fieldApiName] = this.ruleRecordId;
        //             fields[USER_GROUP_API_NAME_FIELD.fieldApiName] = publicGroupApiName;

        //             const recordInput = { apiName: USER_GROUP_OBJECT.objectApiName, fields };
        //             createRecordPromises.push(createRecord(recordInput));
        //         }
        //     });

        //     this.managePackageValues.forEach(managePackageNames => {
        //         const fields = {};
        //         fields[Manage_Package_License_FIELD.fieldApiName] = managePackageNames;
        //         fields[PACKAGE_USER_PERMISSION_RULE.fieldApiName] = this.ruleRecordId;

        //         const recordInput = { apiName: Manage_Package_License_OBJECT.objectApiName, fields };
        //         createRecordPromises.push(createRecord(recordInput));
        //     });

        //     this.permissionSetGroupValues.forEach((permissionSetGroupApiName, index) => {
        //         const permissionSetGroupName = this.permissionSetGroupLabels[index]; // Get the corresponding label

        //         if (permissionSetGroupName) { // Ensure it exists to avoid errors
        //             const fields = {};
        //             fields[USER_PERMISSION_SET_GROUP_NAME_FIELD.fieldApiName] = permissionSetGroupName;
        //             fields[SETGROUP_USER_PERMISSION_RULE.fieldApiName] = this.ruleRecordId;
        //             fields[USER_PERMISSION_SET_GROUP_API_NAME_FIELD.fieldApiName] = permissionSetGroupApiName;

        //             const recordInput = { apiName: USER_PERMISSION_SET_GROUP_OBJECT.objectApiName, fields };
        //             createRecordPromises.push(createRecord(recordInput));
        //         }
        //     });

        //     this.criteriaList.forEach((element, index, array) => {
        //         console.log('Creating record for CRITERIA', element.Criteria_Number__c);
        //         const fields = {};
        //         fields[CRITERIA_NUMBER_FIELD.fieldApiName] = element.Criteria_Number__c;
        //         fields[USER_FIELD_NAME.fieldApiName] = element.User_Field_Name__c
        //         fields[OPERATOR_FIELD.fieldApiName] = element.Operator__c
        //         fields[VALUE_FIELD.fieldApiName] = element.Value__c
        //         fields[USER_CRITERIA_NAME_FIELD.fieldApiName] = element.User_Field_Name__c + ' ' + element.Operator__c + ' ' + element.Value__c
        //         fields[CRITERIA_USER_PERMISSION_RULE.fieldApiName] = this.ruleRecordId;

        //         const recordInput = { apiName: USER_CRITERIA_OBJECT.objectApiName, fields };
        //         createRecordPromises.push(createRecord(recordInput));
        //     });

        //     // 🔹 Execute all createRecord calls in parallel
        //     Promise.all(createRecordPromises)
        //         .then(results => {
        //             const createdRecordIds = results.map(record => record.id);
        //             window.history.replaceState(null, null, '/');
        //             // this[NavigationMixin.Navigate]({

        //             //     type: 'standard__namedPage',

        //             //     attributes: {

        //             //         pageName: 'home'

        //             //     }

        //             // });

        //             const compDetails = {
        //                 componentDef: "c:datatableContainer",
        //                 attributes: {
        //                 }
        //             };
        //             const encodedCompDetails = btoa(JSON.stringify(compDetails));
        //             console.log("compDetails", JSON.stringify(compDetails));
        //             this[NavigationMixin.Navigate]({
        //                 type: "standard__webPage",
        //                 attributes: {
        //                     url: "/one/one.app#" + encodedCompDetails
        //                 }
        //             });

        //             // setTimeout(() => {
        //             //     window.location.reload();
        //             // }, 2000);


        //             console.log('All records created successfully. Record IDs:', JSON.stringify(createdRecordIds));
        //         })
        //         .catch(error => {
        //             console.error('Error in creating one or more records:', error.body?.message || error);
        //         });
        //     this.handleUserPermissionRuleUpdate();
    }

}