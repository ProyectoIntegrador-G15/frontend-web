import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SellersService, Seller } from '../../shared/services/sellers.service';
import { SnackService } from '../../shared/services/snack.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-create-seller',
  templateUrl: './create-seller.component.html',
  styleUrls: ['./create-seller.component.scss']
})
export class CreateSellerComponent implements OnInit {

  sellerForm!: FormGroup;
  isLoading = false;
  error: string | null = null;

  constructor(
    private router: Router,
    private location: Location,
    private fb: FormBuilder,
    private sellersService: SellersService,
    private snackService: SnackService,
    private translateService: TranslateService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    // El formulario ya está inicializado en el constructor
  }

  /**
   * Inicializa el formulario con validaciones
   */
  initForm(): void {
    this.sellerForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      identification: ['', [Validators.required, Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.minLength(7), Validators.maxLength(20)]],
      address: [''],
      commission: [null, [Validators.min(0), Validators.max(100)]],
      sales_target: [null, [Validators.min(0)]]
    });
  }

  /**
   * Obtiene el mensaje de error para un campo específico
   */
  getFieldError(fieldName: string): string {
    const field = this.sellerForm.get(fieldName);
    if (field && field.invalid && field.touched) {
      if (field.errors?.['required']) {
        return 'Este campo es requerido';
      }
      if (field.errors?.['email']) {
        return 'El email no es válido';
      }
      if (field.errors?.['minlength']) {
        return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
      }
      if (field.errors?.['maxlength']) {
        return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;
      }
      if (field.errors?.['min']) {
        return `El valor mínimo es ${field.errors['min'].min}`;
      }
      if (field.errors?.['max']) {
        return `El valor máximo es ${field.errors['max'].max}`;
      }
    }
    return '';
  }

  /**
   * Verifica si un campo tiene error
   */
  hasFieldError(fieldName: string): boolean {
    const field = this.sellerForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  /**
   * Verifica si un campo es requerido
   */
  isFieldRequired(fieldName: string): boolean {
    const field = this.sellerForm.get(fieldName);
    return !!(field && field.hasError('required'));
  }

  /**
   * Maneja el envío del formulario
   */
  onSubmit(): void {
    // Marcar todos los campos como touched para mostrar errores
    Object.keys(this.sellerForm.controls).forEach(key => {
      this.sellerForm.get(key)?.markAsTouched();
    });

    // Validar formulario
    if (this.sellerForm.invalid) {
      this.error = 'Por favor, complete todos los campos requeridos correctamente';
      return;
    }

    // Preparar datos para enviar
    const formValue = this.sellerForm.value;
    // El servicio espera Omit<Seller, 'id' | 'entryDate'>, pero el backend no requiere status
    // El status se establece automáticamente como 'active' en el backend
    const sellerData: Omit<Seller, 'id' | 'entryDate'> = {
      name: formValue.name.trim(),
      identification: formValue.identification.trim(),
      status: 'active', // Requerido por el tipo, pero el backend lo ignora y establece 'active' automáticamente
      email: formValue.email.trim(),
      phone: formValue.phone.trim(),
      address: formValue.address?.trim() || undefined,
      commission: formValue.commission || undefined,
      salesTarget: formValue.sales_target || undefined
    };

    this.isLoading = true;
    this.error = null;

    // Llamar al servicio para crear el vendedor
    this.sellersService.createSeller(sellerData).subscribe({
      next: (seller) => {
        this.isLoading = false;
        // Mostrar mensaje de éxito
        this.snackService.success(
          `Vendedor "${seller.name}" creado exitosamente`
        );
        // Redirigir a la lista de vendedores
        this.router.navigate(['/dashboard/sellers']);
      },
      error: (error) => {
        console.error('Error al crear el vendedor:', error);
        this.isLoading = false;
        
        // Manejar diferentes tipos de errores
        if (error.message?.includes('identificación')) {
          this.error = 'Ya existe un vendedor con esta identificación';
        } else {
          this.error = error.message || 'Error al crear el vendedor. Por favor, intente nuevamente';
        }
        
        // Mostrar snack de error
        this.snackService.error(this.error);
      }
    });
  }

  /**
   * Cancela y regresa a la lista
   */
  goBack(): void {
    this.location.back();
  }

  /**
   * Limpia el formulario
   */
  resetForm(): void {
    this.sellerForm.reset();
    this.error = null;
    // Marcar todos los campos como untouched
    Object.keys(this.sellerForm.controls).forEach(key => {
      this.sellerForm.get(key)?.markAsUntouched();
    });
  }

}

