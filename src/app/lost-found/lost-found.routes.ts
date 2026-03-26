import { Routes } from '@angular/router';
import { LostListComponent } from './components/lost-list/lost-list.component';
import { LostPostComponent } from './components/lost-post/lost-post.component';
import { LostDetailsComponent } from './components/lost-details/lost-details.component';
import { UserLostItemsComponent } from './components/user-lost-items/user-lost-items.component';

export const LOST_FOUND_ROUTES: Routes = [
    { path: '', component: LostListComponent },
    { path: 'post', component: LostPostComponent },
    { path: 'details/:id', component: LostDetailsComponent },
    { path: 'my-items', component: UserLostItemsComponent }
];
