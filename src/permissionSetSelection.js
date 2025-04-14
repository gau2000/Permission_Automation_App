import { LightningElement, track, wire, api } from 'lwc';
import LightningModal from 'lightning/modal';
import getPermissionSetList from '@salesforce/apex/UserPermissionController.getPermissionSetList';
import getPermissionRuleRelatedRecords from '@salesforce/apex/UserPermissionController.getPermissionRuleRelatedRecords';
import getPermissionSetRecordsToDelete from '@salesforce/apex/UserPermissionController.getPermissionSetRecordsToDelete';
import getPermissionSetGroupsToDelete from '@salesforce/apex/UserPermissionController.getPermissionSetGroupsToDelete';
import getPublicGroupRecordsToDelete from '@salesforce/apex/UserPermissionController.getPublicGroupRecordsToDelete';
import getManagePackageRecordsToDelete from '@salesforce/apex/UserPermissionController.getManagePackageRecordsToDelete';
import updateUserCriteria from '@salesforce/apex/UserPermissionController.updateUserCriteria';
import deleteRecords from '@salesforce/apex/UserPermissionController.deleteRecords';
import { createRecord, updateRecord } from 'lightning/uiRecordApi';

import USER_PERMISSION_NAME_FIELD from "@salesforce/schema/UserPermissionRule__c.Name";
import USER_TRIGGER_POINT_FIELD from "@salesforce/schema/UserPermissionRule__c.User_Trigger_Point__c";
import ACTIVE_FIELD from "@salesforce/schema/UserPermissionRule__c.Active__c";
import USER_CRITERIA_CONDITION_FIELD from "@salesforce/schema/UserPermissionRule__c.User_Criteria_Condition__c";
import ID_FIELD from "@salesforce/schema/UserPermissionRule__c.Id";

import USER_CRITERIA_OBJECT from '@salesforce/schema/UserCriteria__c';
import USER_CRITERIA_NAME_FIELD from '@salesforce/schema/UserCriteria__c.Name';
import CRITERIA_NUMBER_FIELD from '@salesforce/schema/UserCriteria__c.Criteria_Number__c';
import USER_FIELD_NAME from '@salesforce/schema/UserCriteria__c.User_Field_Name__c';
import OPERATOR_FIELD from '@salesforce/schema/UserCriteria__c.Operator__c';
import VALUE_FIELD from '@salesforce/schema/UserCriteria__c.Value__c';
import DATATYPE_OF_USER_FIELD from '@salesforce/schema/UserCriteria__c.DataType_of_User_Field__c';
import REFERENCE_OBJECT_API_NAME_FIELD from '@salesforce/schema/UserCriteria__c.Reference_Object_Api_Name__c';
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

export default class PermissionSetSelection extends LightningModal {
    @track permissionSetvalues = [];
    @track selectedValues = [];
    @track selectedLabels = [];
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
    @api deletedCriteriaIdList
    @api action
    @api ruleName
    @api userTriggerPoint
    @api active
    @api toastService
    @api isPermissionRuleModified
    @api isConditionLogicModified
    @track error
    @track rules = [];
    @track createdPermissionSetValues = []
    @track createdPermissionSetLabels = []
    @track createPublicGroupValues = []
    @track createdPublicGroupLabels = []
    @track createdPermissionSetGroupValues = []
    @track createdPermissionSetGroupLabels = []
    @track createdManagePackageValues = []
    @track recordsToDelete = []
    @track retainedValuesArray = []
    @track removedValuesArray = []
    @track retainedLabelsArray = []
    @track removedLabelsArray = []
    @track activeSections = ["A", "B", "C", "D"]
    isPermissionsModified = false;


    @wire(getPermissionRuleRelatedRecords, {
        permissionRuleId: "$ruleRecordId"
    })
    wiredRules({ error, data }) {
        if (data) {
            this.rules = data;
            this.rules.forEach(rule => {
                if (rule.User_Permission_Sets__r) {
                    rule.User_Permission_Sets__r.forEach(permissionSet => {
                        this.createdPermissionSetValues.push(permissionSet.User_Permission_Set_Api_Name__c)
                        this.createdPermissionSetLabels.push(permissionSet.Name)
                        this.checkValuesSelection();
                    });
                }
            })
        } else if (error) {
            console.error('Error in Fetching Permission Rule Related Records:', error);
        }
    }

    connectedCallback() {
        if (this.createdPermissionSetValues != null && this.createdPermissionSetLabels != null) {
            this.selectedValues = this.createdPermissionSetValues;
            this.selectedLabels = this.createdPermissionSetLabels;
        }
    }

    handlePermissionSetGroupValuesOnLoad(event) {
        this.createdPermissionSetGroupValues = event.detail.values
        this.createdPermissionSetGroupLabels = event.detail.labels
        if (this.createdPermissionSetGroupValues != null && this.createdPermissionSetGroupLabels != null) {
            this.permissionSetGroupValues = this.createdPermissionSetGroupValues;
            this.permissionSetGroupLabels = this.createdPermissionSetGroupLabels;
            this.checkValuesSelection();
        }
    }

    handlePublicGroupValuesOnLoad(event) {
        this.createPublicGroupValues = event.detail.values
        this.createdPublicGroupLabels = event.detail.labels
        if (this.createPublicGroupValues != null && this.createdPublicGroupLabels != null) {
            this.publicGroupValues = this.createPublicGroupValues;
            this.publicGroupLabels = this.createdPublicGroupLabels;
            this.checkValuesSelection();
        }
    }

    handlePackageValuesOnLoad(event) {
        this.createdManagePackageValues = event.detail.values
        if (this.createdManagePackageValues != null) {
            this.managePackageValues = this.createdManagePackageValues;
            this.checkValuesSelection();
        }
    }

    handlePermissionSetChange(event) {
        this.selectedValues = event.detail.value;
        this.selectedLabels = this.selectedValues.map(option => this.options.find(o => o.value === option).label);
        this.checkValuesSelection();
    }

    handlePackageValuesSelection(event) {
        this.managePackageValues = event.detail.ApiName;
        this.managePackageLabels = event.detail.Name;
        this.checkValuesSelection();
    }

    handlePermissionSetGroupValuesSelection(event) {
        this.permissionSetGroupValues = event.detail.ApiName;
        this.permissionSetGroupLabels = event.detail.Name;
        this.checkValuesSelection();
    }

    handlePublicGroupValuesSelection(event) {
        this.publicGroupValues = event.detail.ApiName;
        this.publicGroupLabels = event.detail.Name;
        this.checkValuesSelection();
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
        return this.permissionSetvalues;
    }

    handleUserPermissionRuleUpdate() {
        const fields = {};
        fields[ID_FIELD.fieldApiName] = this.ruleRecordId;
        fields[USER_PERMISSION_NAME_FIELD.fieldApiName] = this.ruleName;
        fields[USER_TRIGGER_POINT_FIELD.fieldApiName] = this.userTriggerPoint;
        fields[ACTIVE_FIELD.fieldApiName] = this.active;
        fields[USER_CRITERIA_CONDITION_FIELD.fieldApiName] = this.conditionLogic;
        const recordInput = { fields };

        updateRecord(recordInput).then(() => { })
            .catch((error) => {
                console.error('Error updating Permission Rule record:', error.body.message);
            });
    }


    handleRemovedAndRetainedValues(orginalValue, finalValue, orginalLabel = [], finalLabel = []) {
        const retainedValues = orginalValue.filter(value =>
            finalValue.includes(value)
        );
        const removedValues = orginalValue.filter(value =>
            !finalValue.includes(value)
        );
        const retainedLables = orginalLabel.filter(value =>
            finalLabel.includes(value)
        );
        const removedLabels = orginalLabel.filter(value =>
            !finalLabel.includes(value)
        );
        this.retainedValuesArray.push(...retainedValues);
        this.removedValuesArray.push(...removedValues);
        this.retainedLabelsArray.push(...retainedLables);
        this.removedLabelsArray.push(...removedLabels);
    }

    handleRecordCreation(permissionsetValues, permissionSetLables, permissionsetGroupValues, permissionSetGroupLables, publicGroupValues, publicGroupLabels, managePackageValues, newCriteriaList) {
        const createRecordPromises = [];
        permissionsetValues.forEach((permissionSetApiName, index) => {
            const permissionSetName = permissionSetLables[index];
            if (permissionSetName) {
                const fields = {};
                fields[NAME_FIELD.fieldApiName] = permissionSetName;
                fields[PERMISSION_SET_API_NAME_FIELD.fieldApiName] = permissionSetApiName;
                fields[SET_USER_PERMISSION_RULE.fieldApiName] = this.ruleRecordId;
                const recordInput = { apiName: PERMISSION_SET_OBJECT.objectApiName, fields };
                createRecordPromises.push(createRecord(recordInput));
            }
        });
        publicGroupValues.forEach((publicGroupApiName, index) => {
            const publicGroupName = publicGroupLabels[index];
            if (publicGroupName) {
                const fields = {};
                fields[USER_GROUP_NAME_FIELD.fieldApiName] = publicGroupName;
                fields[GROUP_USER_PERMISSION_RULE.fieldApiName] = this.ruleRecordId;
                fields[USER_GROUP_API_NAME_FIELD.fieldApiName] = publicGroupApiName;
                const recordInput = { apiName: USER_GROUP_OBJECT.objectApiName, fields };
                createRecordPromises.push(createRecord(recordInput));
            }
        });
        managePackageValues.forEach(managePackageNames => {
            const fields = {};
            fields[Manage_Package_License_FIELD.fieldApiName] = managePackageNames;
            fields[PACKAGE_USER_PERMISSION_RULE.fieldApiName] = this.ruleRecordId;
            const recordInput = { apiName: Manage_Package_License_OBJECT.objectApiName, fields };
            createRecordPromises.push(createRecord(recordInput));
        });
        permissionsetGroupValues.forEach((permissionSetGroupApiName, index) => {
            const permissionSetGroupName = permissionSetGroupLables[index];
            if (permissionSetGroupName) {
                const fields = {};
                fields[USER_PERMISSION_SET_GROUP_NAME_FIELD.fieldApiName] = permissionSetGroupName;
                fields[SETGROUP_USER_PERMISSION_RULE.fieldApiName] = this.ruleRecordId;
                fields[USER_PERMISSION_SET_GROUP_API_NAME_FIELD.fieldApiName] = permissionSetGroupApiName;
                const recordInput = { apiName: USER_PERMISSION_SET_GROUP_OBJECT.objectApiName, fields };
                createRecordPromises.push(createRecord(recordInput));
            }
        });
        newCriteriaList.forEach((element) => {
            const fields = {};
            fields[CRITERIA_NUMBER_FIELD.fieldApiName] = element.Criteria_Number__c;
            fields[USER_FIELD_NAME.fieldApiName] = element.User_Field_Name__c
            fields[OPERATOR_FIELD.fieldApiName] = element.Operator__c
            fields[VALUE_FIELD.fieldApiName] = element.Value__c
            fields[USER_CRITERIA_NAME_FIELD.fieldApiName] = element.User_Field_Name__c + ' ' + element.Operator__c + ' ' + element.Value__c
            fields[DATATYPE_OF_USER_FIELD.fieldApiName] = element.dataType
            fields[REFERENCE_OBJECT_API_NAME_FIELD.fieldApiName] = element.referenceObjectApiName
            fields[CRITERIA_USER_PERMISSION_RULE.fieldApiName] = this.ruleRecordId;
            const recordInput = { apiName: USER_CRITERIA_OBJECT.objectApiName, fields };
            createRecordPromises.push(createRecord(recordInput));
        });
        Promise.all(createRecordPromises)
            .then(results => {
                const createdRecordIds = results.map(record => record.id);
            })
            .catch(error => {
                console.error('Error in creating one or more records:', error.body?.message || error);
            });
    }

    handleCriteriaUpdate(updatedCriteriaList) {
        const criteriaToUpdate = updatedCriteriaList.map(criteria => ({
            Id: criteria.criteriaRecordId,
            Criteria_Number__c: criteria.Criteria_Number__c,
            User_Field_Name__c: criteria.User_Field_Name__c,
            Operator__c: criteria.Operator__c,
            Value__c: criteria.Value__c,
            Name: criteria.User_Field_Name__c + ' ' + criteria.Operator__c + ' ' + criteria.Value__c,
            DataType_of_User_Field__c: criteria.dataType,
            Reference_Object_Api_Name__c: criteria.referenceObjectApiName
        }));
        updateUserCriteria({ criteriaList: criteriaToUpdate })
            .then(() => { })
            .catch(error => {
                console.error('Error updating User Criteria:', error.body?.message || error);
            });
    }

    filteroutRetainedPermissionRecords() {
        const filterValues = (values, retainedValues) => values.filter(value => !retainedValues.includes(value));
        this.selectedValues = filterValues(this.selectedValues, this.retainedValuesArray);
        this.selectedLabels = filterValues(this.selectedLabels, this.retainedLabelsArray);
        this.permissionSetGroupValues = filterValues(this.permissionSetGroupValues, this.retainedValuesArray);
        this.permissionSetGroupLabels = filterValues(this.permissionSetGroupLabels, this.retainedLabelsArray);
        this.publicGroupValues = filterValues(this.publicGroupValues, this.retainedValuesArray);
        this.publicGroupLabels = filterValues(this.publicGroupLabels, this.retainedLabelsArray);
        this.managePackageValues = filterValues(this.managePackageValues, this.retainedValuesArray);
    }

    deleteRemovedPermissionsAndCriterias() {
        Promise.all([
            getPermissionSetRecordsToDelete({ jsonString: JSON.stringify(this.removedValuesArray), ruleRecordId: this.ruleRecordId }),
            getPermissionSetGroupsToDelete({ jsonString: JSON.stringify(this.removedValuesArray), ruleRecordId: this.ruleRecordId }),
            getPublicGroupRecordsToDelete({ jsonString: JSON.stringify(this.removedValuesArray), ruleRecordId: this.ruleRecordId }),
            getManagePackageRecordsToDelete({ jsonString: JSON.stringify(this.removedValuesArray), ruleRecordId: this.ruleRecordId })
        ])
            .then(results => {
                this.recordsToDelete = results.flatMap(result => result.map(record => record.Id));
                this.recordsToDelete.push(...this.deletedCriteriaIdList);
                if (this.recordsToDelete.length > 0) {
                    deleteRecords({ recordIds: this.recordsToDelete })
                        .then(() => {

                        })
                        .catch(error => {
                            console.error('Delete Error:', error);
                        })
                }
            })
            .catch(error => {
                console.error("❌ Error:", error);
            });
    }

    handleSave() {
        let newCriteriaList = [];
        let updatedCriteriaList = [];
        let isCriteriaModified = false;

        if ((JSON.stringify(this.selectedValues) !== JSON.stringify(this.createdPermissionSetValues)) || (JSON.stringify(this.permissionSetGroupValues) !== JSON.stringify(this.createdPermissionSetGroupValues)) || (JSON.stringify(this.publicGroupValues) !== JSON.stringify(this.createPublicGroupValues)) || (JSON.stringify(this.managePackageValues) !== JSON.stringify(this.createdManagePackageValues))) {
            this.isPermissionsModified = true;
        }

        if (this.action == 'create') {
            newCriteriaList.push(...this.criteriaList)
            this.handleUserPermissionRuleUpdate();
            this.handleRecordCreation(this.selectedValues, this.selectedLabels, this.permissionSetGroupValues, this.permissionSetGroupLabels, this.publicGroupValues, this.publicGroupLabels, this.managePackageValues, newCriteriaList)
            if (this.toastService && typeof this.toastService.showToast === 'function') {
                this.toastService.showToast('Success', 'User Permission Rule Record is Created Successfully!', 'success');
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else {
                console.error('Toast service reference not valid.');
            }
            this.close('okay');
        }
        else if (this.action == 'edit') {
            this.criteriaList.forEach((criteria) => {
                if (criteria.isCriteriaNew) {
                    newCriteriaList = [...newCriteriaList, criteria]
                } else if (criteria.isCriteriaModified) {
                    isCriteriaModified = true;
                    updatedCriteriaList = [...updatedCriteriaList, criteria]
                }
            })

            if (updatedCriteriaList.length !== 0) {
                this.handleCriteriaUpdate(updatedCriteriaList);
            }

            if (this.isConditionLogicModified || this.isPermissionRuleModified || newCriteriaList.length !== 0 || this.deletedCriteriaIdList.length !== 0) {
                this.handleUserPermissionRuleUpdate();
            }

            if (this.createdPermissionSetValues.length !== 0 || this.createdPermissionSetGroupValues.length !== 0 || this.createPublicGroupValues.length !== 0 || this.createdManagePackageValues.length !== 0 || this.deletedCriteriaIdList.length !== 0 || this.selectedValues.length !== 0 || this.permissionSetGroupValues.length !== 0 || this.publicGroupValues.length !== 0 || this.managePackageValues.length !== 0 || newCriteriaList.length !== 0) {

                this.handleRemovedAndRetainedValues(this.createdPermissionSetValues, this.selectedValues, this.createdPermissionSetLabels, this.selectedLabels);
                this.handleRemovedAndRetainedValues(this.createdPermissionSetGroupValues, this.permissionSetGroupValues, this.createdPermissionSetGroupLabels, this.permissionSetGroupLabels);
                this.handleRemovedAndRetainedValues(this.createPublicGroupValues, this.publicGroupValues, this.createdPublicGroupLabels, this.publicGroupLabels);
                this.handleRemovedAndRetainedValues(this.createdManagePackageValues, this.managePackageValues);

                if ((this.removedValuesArray.length !== 0 || this.deletedCriteriaIdList.length !== 0) && this.ruleRecordId != '') {
                    this.deleteRemovedPermissionsAndCriterias()
                }

                if (this.retainedLabelsArray.length !== 0 && this.retainedValuesArray.length !== 0) {
                    this.filteroutRetainedPermissionRecords()
                }

                this.handleRecordCreation(this.selectedValues, this.selectedLabels, this.permissionSetGroupValues, this.permissionSetGroupLabels, this.publicGroupValues, this.publicGroupLabels, this.managePackageValues, newCriteriaList)
            }

            if (this.isConditionLogicModified || this.isPermissionRuleModified || newCriteriaList.length !== 0 || this.deletedCriteriaIdList.length !== 0 || isCriteriaModified || this.isPermissionsModified) {
                if (this.toastService && typeof this.toastService.showToast === 'function') {
                    this.toastService.showToast('Success', 'User Permission Rule Record is Updated Successfully!', 'success');
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                } else {
                    console.error('Toast service reference not valid.');
                }
            }
        }
        this.close('okay');
    }

    handleCancel() {
        this.close('okay');
    }
}
