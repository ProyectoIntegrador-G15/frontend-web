import { TestBed } from '@angular/core/testing';
import { TaskListService } from './task-list.service';
import { take } from 'rxjs/operators';

describe('TaskListService', () => {
  let service: TaskListService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TaskListService]
    });
    service = TestBed.inject(TaskListService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have initial activeTab as "all"', (done) => {
    service.activeTab$.pipe(take(1)).subscribe(tab => {
      expect(tab).toBe('all');
      done();
    });
  });

  it('should update activeTab when setActiveTab is called', (done) => {
    service.setActiveTab('pending');
    
    service.activeTab$.pipe(take(1)).subscribe(tab => {
      expect(tab).toBe('pending');
      done();
    });
  });

  it('should emit new tab value when setActiveTab is called', (done) => {
    service.activeTab$.pipe(take(2)).subscribe(tab => {
      if (tab === 'completed') {
        expect(tab).toBe('completed');
        done();
      }
    });
    
    service.setActiveTab('completed');
  });

  it('should allow changing tab multiple times', (done) => {
    service.setActiveTab('pending');
    service.setActiveTab('completed');
    service.setActiveTab('all');
    
    service.activeTab$.pipe(take(1)).subscribe(tab => {
      expect(tab).toBe('all');
      done();
    });
  });
});

