import { Routes } from '@angular/router';
import { LostListComponent } from './components/lost-list/lost-list.component';
import { LostPostComponent } from './components/lost-post/lost-post.component';

export const LOST_FOUND_ROUTES: Routes = [
    { path: '', component: LostListComponent },
    { path: 'post', component: LostPostComponent }
];
