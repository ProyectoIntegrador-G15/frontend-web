import {Component} from '@angular/core'
import {FormBuilder, FormGroup, UntypedFormGroup, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {Location} from '@angular/common';

@Component({
  templateUrl: './login-1.component.html'
})

export class Login1Component {
  isLoading = false;
  error = false;

  passwordVisible = false;
  password?: string;

  validateForm!: UntypedFormGroup;

  constructor(private fb: FormBuilder, private router: Router, private location: Location) {
  }

  submitForm(): void {
    if (this.validateForm.valid) {
      this.router.navigate(['/dashboard/blank-page']).then(() => {
        window.location.reload();
      });
    } else {
      Object.values(this.validateForm.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({onlySelf: true});
        }
      });
    }
  }

  ngOnInit(): void {
    this.validateForm = this.fb.group({
      userName: ['medisupply@dm.com', [Validators.required]],
      password: ['123456', [Validators.required]],
      remember: [true],
    });
  }
}
