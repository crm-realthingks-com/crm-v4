import { MeetingTable } from "@/components/MeetingTable";

const Meetings = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Meetings</h1>
          <p className="text-muted-foreground">Manage your appointments and calls</p>
        </div>
      </div>

      {/* Meeting Table */}
      <MeetingTable />
    </div>
  );
};

export default Meetings;