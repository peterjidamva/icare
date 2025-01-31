import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
} from "@angular/core";
import { Store } from "@ngrx/store";
import { Observable } from "rxjs";
import { Location } from "src/app/core/models";
import { getObservationsFromForm } from "src/app/modules/clinic/helpers/get-observations-from-form.helper";
import { FormValue } from "src/app/shared/modules/form/models/form-value.model";
import { ICAREForm } from "src/app/shared/modules/form/models/form.model";
import { ObservationObject } from "src/app/shared/resources/observation/models/obsevation-object.model";
import { Patient } from "src/app/shared/resources/patient/models/patient.model";
import { VisitObject } from "src/app/shared/resources/visits/models/visit-object.model";
import { AppState } from "src/app/store/reducers";
import { getSavingObservationStatus } from "src/app/store/selectors/observation.selectors";
import { ICARE_CONFIG } from "../../resources/config";
import { OrdersService } from "../../resources/order/services/orders.service";

@Component({
  selector: "app-clinical-notes",
  templateUrl: "./clinical-notes.component.html",
  styleUrls: ["./clinical-notes.component.scss"],
})
export class ClinicalNotesComponent implements OnInit {
  @Input() clinicalForm: ICAREForm;
  @Input() clinicalObservations: ObservationObject;
  @Input() patient: Patient;
  @Input() location: Location;
  @Input() visit: VisitObject;
  @Input() encounterUuid: string;
  @Input() savingObservations: boolean;
  @Input() selectedForm: any;
  @Input() shouldUseOwnFormSelection: boolean;
  @Input() provider: any;
  savingObservations$: Observable<boolean>;
  ordersUpdates$: Observable<any>;

  clinicalForms: ICAREForm[];
  currentForm: ICAREForm;
  currentCustomForm: any;
  currentCustomFormName: string;
  formData: any;
  searchingText: string;
  atLeastOneFieldHasData: boolean = false;
  @Output() saveObservations = new EventEmitter();
  @Input() forms: any[];
  @Output() currentSelectedFormForEmitting = new EventEmitter<any>();
  @Output() updateConsultationOrder = new EventEmitter<any>();
  constructor(
    private store: Store<AppState>,
    private ordersService: OrdersService
  ) {}

  ngOnInit(): void {
    this.clinicalForms = this.clinicalForm?.setMembers || [];
    // this.selectedForm = this.forms[0];
    this.formData = {};
    this.currentForm = this.clinicalForms[0];
    this.currentCustomForm = this.selectedForm
      ? this.selectedForm
      : this.forms[0];
    this.currentSelectedFormForEmitting.emit(this.currentCustomForm);
    this.currentCustomFormName = this.forms[0]?.name;
    this.savingObservations$ = this.store.select(getSavingObservationStatus);
  }

  onSetClinicalForm(e, form) {
    e.stopPropagation();
    this.currentCustomForm = form;
    this.currentCustomFormName = form?.name;
  }

  onSetForm(e, form: ICAREForm): void {
    e.stopPropagation();
    this.currentForm = form;
  }

  onFormUpdate(formValue: FormValue | any, isRawValue?: boolean): void {
    // console.log('vvdvd', formValue.getValues());
    this.formData[this.currentCustomForm.id] = {
      ...(this.formData[this.currentCustomForm.id] || {}),
      ...(isRawValue ? formValue : formValue.getValues()),
    };
    this.atLeastOneFieldHasData =
      (
        Object.keys(this.formData[this.currentCustomForm.id])
          ?.map((key) => this.formData[this.currentCustomForm.id][key]?.value)
          ?.filter((value) => value) || []
      )?.length > 0;
  }

  onConfirm(e: Event, visit: any): void {
    e.stopPropagation();
    this.updateConsultationOrder.emit();
    this.saveObservations.emit(
      getObservationsFromForm(
        this.formData[this.currentCustomForm?.id],
        this.patient?.personUuid,
        this.location?.id,
        this.visit?.encounterUuid
          ? this.visit?.encounterUuid
          : JSON.parse(localStorage.getItem("patientConsultation"))[
              "encounterUuid"
            ]
      )
    );
  }

  onClear(event: Event, form: any): void {
    event.stopPropagation();
    this.currentCustomForm = null;
    setTimeout(() => {
      this.currentCustomForm = form;
    }, 20);
  }
}
