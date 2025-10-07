import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ChatComponent } from './chat/chat.component';
import { TodoListComponent } from './todo/todo.component';
import { ProjectListComponent } from './projects/project-list/project-list.component';
import { ProjectDetailsComponent } from './projects/project-details/project-details.component';
import { ContactListComponent } from './contacts/contacts-list/contact-list.component';
import { ContactGridComponent } from './contacts/contacts-grid/contact-grid.component';
import { InboxComponent } from './email/inbox/inbox.component';
import { ReadEmailComponent } from './email/read-email/read-email.component';
import { SupportComponent } from './supports/support/support.component';
import { AddSupportComponent } from './supports/add-support/add-support.component';
import { ViewSupportComponent } from './supports/view-support/view-support.component';
import { ImportComponent } from './import-export/import/import.component';
import { ExportComponent } from './import-export/export/export.component';
import { CalendarComponent } from './calendar/calendar.component';
const routes: Routes = [
    {
      path: 'email',
      children: [
          {
              path: 'inbox',
              component: InboxComponent,
              data: {
                  title: 'Inbox',
              }
          },
          {
              path: 'read-email',
              component: ReadEmailComponent,
              data: {
                  title: 'Read Email',
              }
          }
      ]
    },
    {
        path: 'chat',
        component: ChatComponent,
        data: {
            title: 'Chats',
        }
    },
    {
        path: 'projects',
        children: [
            {
                path: 'project-list',
                component: ProjectListComponent,
                data: {
                    title: 'Project List',
                    headerDisplay: "none"
                }
            },
            {
                path: 'project-details',
                component: ProjectDetailsComponent,
                data: {
                    title: 'Project Details',
                    headerDisplay: "none"
                }
            }
        ]
    },
    {
      path: 'contacts',
      children: [
          {
              path: 'contacts-list',
              component: ContactListComponent,
              data: {
                  title: 'contact List',
                  headerDisplay: "none"
              }
          },
          {
              path: 'contacts-grid',
              component: ContactGridComponent,
              data: {
                  title: 'contact grid',
                  headerDisplay: "none"
              }
          }
      ]
    },
    {
        path: 'todo',
        component: TodoListComponent,
        data: {
            title: 'Todo',
        }
    },
    {
      path: 'calendar',
      component: CalendarComponent,
        data: {
            title: 'Calendar',
        }
    },
    {
      path: 'supports',
      children: [
          {
              path: 'support',
              component: SupportComponent,
              data: {
                  title: 'Support ticket',
              }
          },
          {
              path: 'add-support',
              component: AddSupportComponent,
              data: {
                  title: 'Add Support',
              }
          },
          {
            path: 'view-support',
            component: ViewSupportComponent,
            data: {
                title: 'Ticket Details',
            }
          }
      ]
    },
    {
      path: 'import-export',
      children: [
          {
            path: 'import',
            component: ImportComponent,
            data: {
                title: 'Import',
            }
          },
          {
            path: 'export',
            component: ExportComponent,
            data: {
                title: 'Export',
            }
          },
      ]
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class AppsRoutingModule { }
