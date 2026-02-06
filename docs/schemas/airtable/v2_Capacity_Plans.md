# v2_Capacity_Plans

## Fields

| Field Name | Type | Description |
|------------|------|-------------|
| carrier_dot | Number | FMCSA DOT number - carrier reference |
| plan_date | Date | Date for capacity planning snapshot |
| total_drivers | Number | Total drivers in fleet |
| available_drivers | Number | Drivers available for assignment |
| drivers_on_load | Number | Drivers currently on active loads |
| drivers_available | Number | Drivers ready for new assignments |
| booked_loads | Number | Number of loads currently booked |
| pending_loads | Number | Number of loads pending assignment |
| utilization_pct | Number | Percentage of fleet utilization (0-100) |
| capacity_gap | Number | Gap between available capacity and demand |
| revenue_at_risk | Number | Estimated revenue at risk due to capacity constraints |
| recommendations | Multiple Line Text | JSON array of AI-generated capacity optimization suggestions |

## Notes

- Auto-generated schema documentation
- Generated: 2026-02-05
