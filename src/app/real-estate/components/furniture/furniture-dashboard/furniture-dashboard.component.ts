import { StatsService } from '../../../services/stats.service';
import { Stats } from '../../../models/stats.model';
import { LucideAngularModule, LayoutDashboard, ShoppingBag, DollarSign, AlertCircle, BarChart3, TrendingUp, ChevronLeft, Briefcase, Package, Tag } from 'lucide-angular';

@Component({
  selector: 'app-furniture-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './furniture-dashboard.component.html',
  styleUrls: ['./furniture-dashboard.component.scss']
})
export class FurnitureDashboardComponent implements OnInit {
  readonly DashboardIcon = LayoutDashboard;
  readonly ShoppingBagIcon = ShoppingBag;
  readonly DollarSignIcon = DollarSign;
  readonly AlertIcon = AlertCircle;
  readonly ChartIcon = BarChart3;
  readonly TrendingIcon = TrendingUp;
  readonly BackIcon = ChevronLeft;
  readonly BriefcaseIcon = Briefcase;
  readonly PackageIcon = Package;
  readonly TagIcon = Tag;
  stats?: Stats;
  loading = true;
  error?: string;

  constructor(private statsService: StatsService) {}

  ngOnInit(): void {
    this.statsService.getStats().subscribe({
      next: (data) => { this.stats = data; this.loading = false; },
      error: () => { this.error = 'Erreur lors du chargement.'; this.loading = false; }
    });
  }

  getCategories(): string[] {
    return this.stats ? Object.keys(this.stats.countByCategory) : [];
  }

  getConditions(): string[] {
    return this.stats ? Object.keys(this.stats.countByCondition) : [];
  }

  getBarWidth(value: number, max: number): string {
    return `${Math.round((value / max) * 100)}%`;
  }

  getMaxCategoryCount(): number {
    if (!this.stats) return 1;
    return Math.max(...Object.values(this.stats.countByCategory));
  }
}
