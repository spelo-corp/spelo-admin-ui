
const mockTeam = [
    { name: "John Carter", role: "Engineer", pct: 78 },
    { name: "Lisa Tran", role: "Moderator", pct: 92 },
    { name: "Minh Nguyen", role: "QA", pct: 65 },
];

const TeamList = () => {
    return (
        <div
            className="
        bg-white rounded-card shadow-card border border-slate-200
        p-6 flex flex-col gap-4
      "
        >
            <h3 className="text-lg font-semibold text-slate-800">Team Progress</h3>

            <div className="flex flex-col gap-4">
                {mockTeam.map((user) => (
                    <div
                        key={user.name}
                        className="flex items-center justify-between text-sm"
                    >
                        <div>
                            <div className="font-medium text-slate-800">{user.name}</div>
                            <div className="text-slate-400 text-xs">{user.role}</div>
                        </div>

                        <div className="flex-1 mx-4">
                            <div className="w-full bg-slate-200 h-2 rounded-full">
                                <div
                                    className="h-2 rounded-full bg-brand"
                                    style={{ width: `${user.pct}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="font-medium text-slate-600">{user.pct}%</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TeamList;
