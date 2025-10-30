import {Component} from '@angular/core'
import { AuthenticationService } from '../../shared/services/authentication.service';
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

  constructor(private fb: FormBuilder, private router: Router, private location: Location, private auth: AuthenticationService) {
  }

  submitForm(): void {
    if (this.validateForm.valid) {
      this.isLoading = true;
      this.error = false;

      const email = this.validateForm.get('userName')?.value;
      const password = this.validateForm.get('password')?.value;

      this.auth.firebaseLogin(email, password).subscribe({
        next: (resp) => {
          this.router.navigate(['/dashboard/blank-page']).then(() => {
            window.location.reload();
          });
        },
        error: () => {
          this.error = true;
          this.isLoading = false;
        }
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
      userName: ['admin@medisupply.com', [Validators.required]],
      password: ['MiPassword123!', [Validators.required]],
      remember: [true],
    });
  }
}
