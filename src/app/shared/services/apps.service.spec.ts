import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AppsService } from './apps.service';
import { Chat } from '../interfaces/chat.type';
import { Files } from '../interfaces/file-manager.type';
import { Mail } from '../interfaces/mail.type';
import { ProjectList } from '../interfaces/project-list.type';
import { ContactGrid } from '../interfaces/contacts-grid.type';

describe('AppsService', () => {
  let service: AppsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AppsService]
    });
    service = TestBed.inject(AppsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getChatJSON', () => {
    it('should fetch chat data', () => {
      const mockChat: Chat[] = [{ id: 1, name: 'Chat 1' } as unknown as Chat];

      service.getChatJSON().subscribe(data => {
        expect(data).toEqual(mockChat);
      });

      const req = httpMock.expectOne('./assets/data/apps/chat-data.json');
      expect(req.request.method).toBe('GET');
      req.flush(mockChat);
    });
  });

  describe('getFileManagerJson', () => {
    it('should fetch file manager data', () => {
      const mockFiles: Files[] = [{ id: 1, name: 'File 1' } as unknown as Files];

      service.getFileManagerJson().subscribe(data => {
        expect(data).toEqual(mockFiles);
      });

      const req = httpMock.expectOne('./assets/data/apps/file-manager-data.json');
      expect(req.request.method).toBe('GET');
      req.flush(mockFiles);
    });
  });

  describe('getMailJson', () => {
    it('should fetch mail data', () => {
      const mockMail: Mail[] = [{ id: 1, subject: 'Mail 1' } as unknown as Mail];

      service.getMailJson().subscribe(data => {
        expect(data).toEqual(mockMail);
      });

      const req = httpMock.expectOne('./assets/data/apps/mail-data.json');
      expect(req.request.method).toBe('GET');
      req.flush(mockMail);
    });
  });

  describe('getReadMailJson', () => {
    it('should fetch read mail data', () => {
      const mockMail: Mail[] = [{ id: 1, subject: 'Read Mail 1' } as unknown as Mail];

      service.getReadMailJson().subscribe(data => {
        expect(data).toEqual(mockMail);
      });

      const req = httpMock.expectOne('./assets/data/apps/read-email.json');
      expect(req.request.method).toBe('GET');
      req.flush(mockMail);
    });
  });

  describe('getProjectListJson', () => {
    it('should fetch project list data', () => {
      const mockProjects: ProjectList[] = [{ id: 1, name: 'Project 1' } as unknown as ProjectList];

      service.getProjectListJson().subscribe(data => {
        expect(data).toEqual(mockProjects);
      });

      const req = httpMock.expectOne('./assets/data/apps/project-list-data.json');
      expect(req.request.method).toBe('GET');
      req.flush(mockProjects);
    });
  });

  describe('getContactGridJson', () => {
    it('should fetch contact grid data', () => {
      const mockContacts: ContactGrid[] = [{ id: 1, name: 'Contact 1' } as unknown as ContactGrid];

      service.getContactGridJson().subscribe(data => {
        expect(data).toEqual(mockContacts);
      });

      const req = httpMock.expectOne('./assets/data/apps/contacts.json');
      expect(req.request.method).toBe('GET');
      req.flush(mockContacts);
    });
  });
});

