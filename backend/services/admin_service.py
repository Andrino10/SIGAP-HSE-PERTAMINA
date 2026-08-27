import datetime
from repositories.admin_repository import admin_repo
from repositories.complaint_repository import complaint_repo
from utils.logger import logger

class AdminService:
    def authenticate(self, username, password):
        return admin_repo.authenticate(username, password)

    def validate_session(self, token):
        return admin_repo.validate_session(token)

    def logout(self, token):
        return admin_repo.revoke_session(token)

    def get_dashboard_stats(self, start_date=None, end_date=None):
        """Calculate dynamic metrics and distributions for the Admin Dashboard."""
        all_complaints = complaint_repo.get_all()
        
        filtered = []
        for c in all_complaints:
            # Check date range filter if provided
            dt_str = c.get("occurrence_date") or (c.get("created_at") or "")[:10]
            if start_date and dt_str and dt_str < start_date:
                continue
            if end_date and dt_str and dt_str > end_date:
                continue
            filtered.append(c)

        total = len(filtered)
        open_count = sum(1 for c in filtered if c.get("status") == "Open")
        in_progress_count = sum(1 for c in filtered if c.get("status") == "In Progress")
        closed_count = sum(1 for c in filtered if c.get("status") == "Closed / Resolved")
        
        critical_count = sum(
            1 for c in filtered
            if str(c.get("risk_level", "")).lower() == "tinggi"
            or str(c.get("urgency", "")).lower() in {"tinggi", "berat", "high", "critical"}
        )

        # Breakdowns
        cat_counts = {}
        for c in filtered:
            cat = c.get("category") or "Umum"
            cat_counts[cat] = cat_counts.get(cat, 0) + 1
        sorted_cats = sorted(cat_counts.items(), key=lambda x: x[1], reverse=True)

        finding_counts = {"Unsafe Condition": 0, "Unsafe Act": 0}
        for c in filtered:
            ft = c.get("finding_type", "Unsafe Condition")
            if ft not in finding_counts:
                finding_counts[ft] = 0
            finding_counts[ft] += 1

        risk_counts = {"Tinggi": 0, "Sedang": 0, "Rendah": 0}
        for c in filtered:
            rl = c.get("risk_level", "Sedang")
            if rl not in risk_counts:
                risk_counts[rl] = 0
            risk_counts[rl] += 1

        # Recent 5 reports
        recent = filtered[:5]

        return {
            "summary": {
                "total": total,
                "open": open_count,
                "in_progress": in_progress_count,
                "closed": closed_count,
                "critical": critical_count
            },
            "category_distribution": [
                {"category": cat, "count": cnt} for cat, cnt in sorted_cats
            ],
            "finding_type_distribution": finding_counts,
            "risk_distribution": risk_counts,
            "recent_reports": recent
        }

    def get_reports(self, filters=None, page=1, limit=50):
        all_complaints = complaint_repo.get_all()
        filters = filters or {}
        
        search = str(filters.get("search", "")).strip().lower()
        status_filter = str(filters.get("status", "")).strip()
        category_filter = str(filters.get("category", "")).strip()
        urgency_filter = str(filters.get("urgency", "")).strip()
        finding_type_filter = str(filters.get("finding_type", "")).strip()
        start_date = filters.get("start_date")
        end_date = filters.get("end_date")

        filtered = []
        for c in all_complaints:
            # Search query match
            if search:
                matched_search = (
                    search in str(c.get("ticket_number", "")).lower()
                    or search in str(c.get("reporter_name", "")).lower()
                    or search in str(c.get("location", "")).lower()
                    or search in str(c.get("description", "")).lower()
                    or search in str(c.get("complaint_description", "")).lower()
                    or search in str(c.get("division", "")).lower()
                )
                if not matched_search:
                    continue

            # Status filter
            if status_filter and status_filter.lower() != "semua":
                if c.get("status", "").lower() != status_filter.lower():
                    continue

            # Category filter
            if category_filter and category_filter.lower() != "semua":
                if c.get("category", "").lower() != category_filter.lower():
                    continue

            # Urgency filter
            if urgency_filter and urgency_filter.lower() != "semua":
                if (
                    str(c.get("urgency", "")).lower() != urgency_filter.lower()
                    and str(c.get("risk_level", "")).lower() != urgency_filter.lower()
                ):
                    continue

            # Finding type filter
            if finding_type_filter and finding_type_filter.lower() != "semua":
                if str(c.get("finding_type", "")).lower() != finding_type_filter.lower():
                    continue

            # Date range filter
            dt_str = c.get("occurrence_date") or (c.get("created_at") or "")[:10]
            if start_date and dt_str and dt_str < start_date:
                continue
            if end_date and dt_str and dt_str > end_date:
                continue

            filtered.append(c)

        total = len(filtered)
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        paginated = filtered[start_idx:end_idx]

        return {
            "reports": paginated,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": (total + limit - 1) // limit if limit > 0 else 1
        }

    def get_report_detail(self, ticket_no):
        return complaint_repo.get_by_ticket(ticket_no)

    def update_report(self, ticket_no, update_data, admin_user="Admin HSSE"):
        return complaint_repo.update(ticket_no, update_data, updated_by=admin_user)

    def get_recap(self, filters=None):
        """Generate recap aggregated data for reporting period."""
        reports_res = self.get_reports(filters=filters, page=1, limit=10000)
        reports = reports_res["reports"]
        
        total = len(reports)
        open_count = sum(1 for c in reports if c.get("status") == "Open")
        in_progress_count = sum(1 for c in reports if c.get("status") == "In Progress")
        closed_count = sum(1 for c in reports if c.get("status") == "Closed / Resolved")
        
        critical_count = sum(
            1 for c in reports
            if str(c.get("risk_level", "")).lower() == "tinggi"
            or str(c.get("urgency", "")).lower() in {"tinggi", "berat", "high", "critical"}
        )

        cat_counts = {}
        for c in reports:
            cat = c.get("category") or "Umum"
            cat_counts[cat] = cat_counts.get(cat, 0) + 1

        finding_counts = {}
        for c in reports:
            ft = c.get("finding_type", "Unsafe Condition")
            finding_counts[ft] = finding_counts.get(ft, 0) + 1

        risk_counts = {}
        for c in reports:
            rl = c.get("risk_level", "Sedang")
            risk_counts[rl] = risk_counts.get(rl, 0) + 1

        return {
            "period": {
                "start_date": (filters or {}).get("start_date") or "Semua",
                "end_date": (filters or {}).get("end_date") or "Semua"
            },
            "summary": {
                "total_reports": total,
                "open": open_count,
                "in_progress": in_progress_count,
                "closed": closed_count,
                "critical": critical_count
            },
            "category_breakdown": cat_counts,
            "finding_type_breakdown": finding_counts,
            "risk_breakdown": risk_counts,
            "reports": reports
        }

admin_service = AdminService()
