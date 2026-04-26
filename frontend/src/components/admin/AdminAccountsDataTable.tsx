import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronsUpDown,
  Columns3,
  Download,
  MoreVertical,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import type { SessionUser } from "../../types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  tableActionsContainerClass,
  tableActionsTightAccountRow,
  tableActionsWideAccountRow,
} from "@/lib/tableActionsLayout";
import { cn } from "@/lib/utils";

function initials(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length >= 2) return `${p[0][0] ?? ""}${p[1][0] ?? ""}`.toUpperCase();
  return name.slice(0, 2).toUpperCase() || "?";
}

function departmentLabel(a: SessionUser): string {
  const line = a.billingAddress?.trim().split("\n")[0]?.trim();
  if (!line) return "—";
  return line.length > 36 ? `${line.slice(0, 34)}…` : line;
}

function lastActiveLabel(id: string): string {
  const opts = ["Just now", "5 min ago", "2 hours ago", "Yesterday", "3 days ago", "1 week ago"];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i) * (i + 1)) % 997;
  return opts[h % opts.length];
}

function compactPages(current: number, total: number): Array<number | "..."> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set<number>([1, total, current, current - 1, current + 1]);
  const nums = Array.from(set).filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out: Array<number | "..."> = [];
  for (let i = 0; i < nums.length; i++) {
    if (i > 0 && nums[i] - nums[i - 1] > 1) out.push("...");
    out.push(nums[i]);
  }
  return out;
}

export function AdminAccountsDataTable({
  kind,
  accounts,
}: {
  kind: "users" | "moderators";
  accounts: SessionUser[];
}) {
  const title = kind === "users" ? "Users" : "Moderators";
  const crumb = kind === "users" ? "Users" : "Moderators";
  const subtitle =
    kind === "users"
      ? "Manage procurement requesters and their contact details."
      : "Manage moderators who process orders and documents.";
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const tabFiltered = useMemo(() => {
    if (tab === "active") return accounts.filter((a) => Boolean(a.phone?.trim()));
    if (tab === "inactive") return accounts.filter((a) => !a.phone?.trim());
    if (tab === "suspended") return [];
    return accounts;
  }, [accounts, tab]);

  const searched = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tabFiltered;
    return tabFiltered.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        (a.phone || "").toLowerCase().includes(q) ||
        departmentLabel(a).toLowerCase().includes(q),
    );
  }, [tabFiltered, query]);

  const totalPages = Math.max(1, Math.ceil(searched.length / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pageRows = searched.slice((safePage - 1) * perPage, safePage * perPage);
  const from = searched.length === 0 ? 0 : (safePage - 1) * perPage + 1;
  const to = Math.min(safePage * perPage, searched.length);

  const exportCsv = () => {
    const headers = ["Name", "Email", "Phone", "Role", "Department", "Status"];
    const rows = searched.map((a) => {
      const status = a.phone?.trim() ? "Active" : "Inactive";
      const role = kind === "users" ? "User" : "Moderator";
      return [a.name, a.email, a.phone || "", role, departmentLabel(a), status].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",");
    });
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${kind}-export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/admin">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{crumb}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Button asChild className="shrink-0 gap-2 self-start sm:self-auto">
          <Link to="/admin/create">
            <span className="text-lg leading-none">+</span>
            {kind === "users" ? "Add user" : "Add moderator"}
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-4">
          <div className="flex flex-wrap gap-2">
            {(["all", "active", "inactive", "suspended"] as const).map((t) => (
              <Button
                key={t}
                type="button"
                variant={tab === t ? "secondary" : "outline"}
                size="sm"
                className="h-9 rounded-full border px-4 text-xs capitalize shadow-none"
                onClick={() => {
                  setTab(t);
                  setPage(1);
                }}
              >
                {t}
              </Button>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder={kind === "users" ? "Search users…" : "Search moderators…"}
                className="h-10 border-border bg-muted pl-9 shadow-none"
              />
            </div>
            <div className="flex shrink-0 gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="sm" className="h-10 gap-2">
                    <Columns3 className="h-4 w-4" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel>Columns</DropdownMenuLabel>
                  <DropdownMenuItem disabled>All columns visible</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button type="button" variant="outline" size="sm" className="h-10 gap-2" onClick={exportCsv}>
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </div>

        <div className={tableActionsContainerClass("table-scroll")}>
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="w-[280px] pl-6">
                  <button type="button" className="inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground">
                    Name
                    <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </TableHead>
                <TableHead>
                  <button type="button" className="inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground">
                    Role
                    <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  <button type="button" className="inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground">
                    Department
                    <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </TableHead>
                <TableHead>
                  <button type="button" className="inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground">
                    Status
                    <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                  <button type="button" className="inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground">
                    Last active
                    <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </TableHead>
                <TableHead className="w-[100px] pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                    No results match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                pageRows.map((a) => {
                  const active = Boolean(a.phone?.trim());
                  return (
                    <TableRow key={a.id} className="border-b border-border">
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback>{initials(a.name)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-foreground">{a.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{a.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {kind === "users" ? (
                          <Badge className="rounded-md border-0 bg-muted px-2.5 py-0.5 font-medium text-foreground hover:bg-muted">
                            User
                          </Badge>
                        ) : (
                          <Badge className="rounded-md border-0 bg-orange-500 px-2.5 py-0.5 font-medium text-white hover:bg-orange-500">
                            Moderator
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden max-w-[200px] truncate text-muted-foreground md:table-cell">
                        {departmentLabel(a)}
                      </TableCell>
                      <TableCell>
                        {active ? (
                          <Badge className="rounded-md border-0 bg-emerald-600 px-2.5 py-0.5 font-medium text-white hover:bg-emerald-600">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="rounded-md font-medium text-muted-foreground">
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground lg:table-cell">{lastActiveLabel(a.id)}</TableCell>
                      <TableCell className="pr-6 text-right">
                        <div className={tableActionsWideAccountRow()}>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground"
                            asChild
                          >
                            <Link to="/admin/create" aria-label="Edit (opens create account)">
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            aria-label="Remove"
                            onClick={() => {
                              window.alert("Removing accounts is not enabled in this prototype.");
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className={tableActionsTightAccountRow()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground"
                                aria-label="Row actions"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link to="/admin/create" className="flex cursor-pointer items-center gap-2">
                                  <Pencil className="h-4 w-4" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="gap-2 text-destructive focus:text-destructive data-[highlighted]:bg-red-50 data-[highlighted]:text-destructive dark:data-[highlighted]:bg-red-950"
                                onSelect={() => {
                                  window.alert("Removing accounts is not enabled in this prototype.");
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            Showing {from}-{to} of {searched.length} results
          </p>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs">Rows</span>
              <Select
                value={String(perPage)}
                onValueChange={(v) => {
                  setPerPage(parseInt(v, 10));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 w-[4.5rem] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 px-2 text-foreground"
              disabled={safePage <= 1}
              onClick={() => setPage(safePage - 1)}
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {compactPages(safePage, totalPages).map((p, idx) =>
                p === "..." ? (
                  <span key={`e-${idx}`} className="px-1 text-muted-foreground">
                    …
                  </span>
                ) : (
                  <Button
                    key={p}
                    type="button"
                    variant={p === safePage ? "default" : "outline"}
                    size="sm"
                    className={cn("h-9 min-w-9 px-0", p === safePage && "pointer-events-none")}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                ),
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 px-2 text-foreground"
              disabled={safePage >= totalPages}
              onClick={() => setPage(safePage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

    </div>
  );
}
