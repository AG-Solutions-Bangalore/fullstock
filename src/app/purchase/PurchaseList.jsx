import Page from "@/app/dashboard/page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, Edit, Search, SquarePlus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  fetchPurchaseById,
  navigateToPurchaseEdit,
  PURCHASE_LIST,
} from "@/api";
import apiClient from "@/api/axios";
import usetoken from "@/api/usetoken";
import { encryptId } from "@/components/common/Encryption";
import Loader from "@/components/loader/Loader";
import StatusToggle from "@/components/toggle/StatusToggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ButtonConfig } from "@/config/ButtonConfig";
import moment from "moment";
import { RiWhatsappFill } from "react-icons/ri";

const PurchaseList = () => {
  const token = usetoken();

  const {
    data: purchase,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["purchase"],
    queryFn: async () => {
      const response = await apiClient.get(`${PURCHASE_LIST}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.purchase;
    },
  });

  // State for table management

  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const UserId = localStorage.getItem("userType");
  const queryClient = useQueryClient();
  const whatsapp = localStorage.getItem("whatsapp-number");
  const navigate = useNavigate();

  const handleFetchPurchaseById = async (purchaseId) => {
    try {
      const data = await queryClient.fetchQuery({
        queryKey: ["purchaseByid", purchaseId],
        queryFn: () => fetchPurchaseById(purchaseId),
      });

      if (data?.purchase && data?.purchaseSub) {
        handleSendWhatsApp(data.purchase, data.purchaseSub, data.buyer);
      } else {
        console.error("Incomplete data received");
      }
    } catch (error) {
      console.error("Failed to fetch purchase data or send WhatsApp:", error);
    }
  };
  const handleSendWhatsApp = (purchase, purchaseSub, buyer) => {
    const { purchase_ref_no, purchase_date, purchase_vehicle_no } = purchase;

    const { buyer_name, buyer_city } = buyer;
    const purchaseNo = purchase_ref_no?.split("-").pop();
    const itemLines = purchaseSub.map((item) => {
      const name = item.item_name.padEnd(25, " ");
      const box = `(${String(item.purchase_sub_box).replace(
        /\D/g,
        ""
      )})`.padStart(4, " ");
      return `${name}      ${box}`;
    });

    const totalQty = purchaseSub.reduce((sum, item) => {
      const qty = parseInt(item.purchase_sub_box, 10) || 0;
      return sum + qty;
    }, 0);
    const message = `=== PackList ===
  No.        : ${purchaseNo}
  Date       : ${moment(purchase_date).format("DD-MM-YYYY")}
  Party      : ${buyer_name}
  City       : ${buyer_city}
  VEHICLE NO : ${purchase_vehicle_no}
  ======================
  Product    [SIZE]   (QTY)
  ======================
${itemLines.map((line) => "  " + line).join("\n")}
  ======================
  *Total QTY: ${totalQty}*
  ======================`;

    const phoneNumber = `${whatsapp}`;
    // const phoneNumber = "919360485526";
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
  };

  const columns = [
    {
      accessorKey: "index",
      header: "Sl No",
      cell: ({ row }) => <div>{row.index + 1}</div>,
    },
    {
      accessorKey: "purchase_date",
      header: "Date",
      id: "Date",
      cell: ({ row }) => {
        const date = row.original.purchase_date;
        return moment(date).format("DD-MMM-YYYY");
      },
    },
    {
      accessorKey: "buyer_name",
      header: "Buyer Name",
      id: "Buyer Name",
      cell: ({ row }) => <div>{row.original.buyer_name}</div>,
    },
    {
      accessorKey: "purchase_ref_no",
      header: "Ref No",
      id: "Ref No",
      cell: ({ row }) => <div>{row.original.purchase_ref_no}</div>,
    },
    {
      accessorKey: "purchase_vehicle_no",
      header: "Vehicle No",
      id: "Vehicle No",
      cell: ({ row }) => <div>{row.original.purchase_vehicle_no}</div>,
    },
    ...(UserId == 3
      ? [
          {
            accessorKey: "branch_name",
            header: "Branch Name",
            cell: ({ row }) => <div>{row.original.branch_name}</div>,
          },
        ]
      : []),
    {
      accessorKey: "purchase_status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.purchase_status;
        const statusId = row.original.id;
        return (
          <StatusToggle
            initialStatus={status}
            teamId={statusId}
            onStatusChange={() => {
              refetch();
            }}
          />
        );
      },
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        const purchaseId = row.original.id;
        return (
          <div className="flex flex-row">
            {UserId != 3 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        navigateToPurchaseEdit(navigate, purchaseId);
                      }}
                    >
                      <Edit />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edit Purchase</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      handleFetchPurchaseById(encryptId(purchaseId))
                    }
                    className="text-green-500"
                    type="button"
                  >
                    <RiWhatsappFill className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Whatsapp Purchase</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      },
    },
  ];

  const filteredItems =
    purchase?.filter((item) =>
      item.buyer_name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  // Create the table instance
  const table = useReactTable({
    data: purchase || [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  });

  // Render loading state
  if (isLoading) {
    return (
      <Page>
        <div className="flex justify-center items-center h-full">
          <Loader />
        </div>
      </Page>
    );
  }

  // Render error state
  if (isError) {
    return (
      <Page>
        <Card className="w-full max-w-md mx-auto mt-10">
          <CardHeader>
            <CardTitle className="text-destructive">
              Error Fetching purchase
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => refetch()} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </Page>
    );
  }

  return (
    <Page>
      <div className="w-full p-0 md:p-4 grid grid-cols-1">
        <div className="sm:hidden">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl md:text-2xl text-gray-800 font-medium">
              Purchase List
            </h1>
            {UserId != 3 && (
              <div>
                <Button
                  variant="default"
                  className={`md:ml-2 bg-yellow-400 hover:bg-yellow-600 text-black rounded-l-full`}
                  onClick={() => {
                    navigate("/purchase/create");
                  }}
                >
                  <SquarePlus className="h-4 w-4 " /> Purchase
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row md:items-center py-4 gap-2">
            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search purchase..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-8 bg-gray-50 border-gray-200 focus:border-gray-300 focus:ring-gray-200 w-full"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredItems.length > 0 ? (
              filteredItems.map((item, index) => (
                <div
                  key={item.id}
                  className="relative bg-white rounded-lg shadow-sm border-l-4 border-r border-b border-t border-yellow-500 overflow-hidden"
                >
                  <div className="p-2 flex flex-col gap-2">
                    {/* Sl No and Item Name */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="bg-gray-100 text-gray-600 rounded-full w-4 h-4 flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                        <h3 className="font-medium text-sm text-gray-800">
                          {item.buyer_name}
                        </h3>
                      </div>
                      <div className="flex items-center justify-between gap-2 ">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.purchase_status === "Active"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          <StatusToggle
                            initialStatus={item.purchase_status}
                            teamId={item.id}
                            onStatusChange={() => {
                              refetch();
                            }}
                          />
                        </span>
                        {UserId != 3 && (
                          <button
                            variant="ghost"
                            className={`px-2 py-1 bg-yellow-400 hover:bg-yellow-600 rounded-lg text-black text-xs`}
                            onClick={() => {
                              navigateToPurchaseEdit(navigate, item.id);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFetchPurchaseById(encryptId(item.id));
                          }}
                          className="text-green-500"
                          type="button"
                        >
                          <RiWhatsappFill className="h-4 w-4" />
                        </button>{" "}
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-between gap-1">
                      {item.purchase_ref_no && (
                        <div className="inline-flex items-center bg-gray-100 rounded-full px-2 py-1">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-gray-600 mr-1"
                          >
                            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                          </svg>
                          <span className="text-xs text-gray-700">
                            <span className="text-[10px]">Ref No:</span>
                            {item.purchase_ref_no}
                          </span>
                        </div>
                      )}
                      {item.purchase_vehicle_no && (
                        <div className="inline-flex items-center bg-gray-100 rounded-full px-2 py-1">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-gray-600 mr-1"
                          >
                            <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                            <path d="M13 5v2" />
                            <path d="M13 17v2" />
                            <path d="M13 11v2" />
                          </svg>
                          <span className="text-xs text-gray-700">
                            <span className="text-[10px]">Vehicle No:</span>
                            {item.purchase_vehicle_no}
                          </span>
                        </div>
                      )}
                      {item.purchase_date && (
                        <div className="inline-flex items-center bg-gray-100 rounded-full px-2 py-1">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-gray-600 mr-1"
                          >
                            <rect
                              width="18"
                              height="18"
                              x="3"
                              y="4"
                              rx="2"
                              ry="2"
                            />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          <span className="text-xs text-gray-700">
                            {moment(item.purchase_date).format("DD-MMM-YY")}
                          </span>
                        </div>
                      )}
                      {UserId == 3 && (
                        <>
                          {item.branch_name && (
                            <div className="inline-flex items-center bg-gray-100 rounded-full px-2 py-1">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="10"
                                height="10"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-gray-600 mr-1"
                              >
                                <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                                <path d="M13 5v2" />
                                <path d="M13 17v2" />
                                <path d="M13 11v2" />
                              </svg>
                              <span className="text-xs text-gray-700">
                                <span className="text-[10px]">
                                  Branch Name:
                                </span>
                                {item.branch_name}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 text-center text-gray-500">
                No items found.
              </div>
            )}
          </div>
        </div>

        <div className="hidden sm:block">
          <div className="flex text-left text-2xl text-gray-800 font-[400]">
            Purchase List
          </div>

          <div className="flex flex-col md:flex-row md:items-center py-4 gap-2">
            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search Purchase..."
                value={table.getState().globalFilter || ""}
                onChange={(event) => table.setGlobalFilter(event.target.value)}
                className="pl-8 bg-gray-50 border-gray-200 focus:border-gray-300 focus:ring-gray-200 w-full"
              />
            </div>

            {/* Dropdown Menu & Sales Button */}
            <div className="flex flex-col md:flex-row md:ml-auto gap-2 w-full md:w-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full md:w-auto">
                    Columns <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
              {UserId != 3 && (
                <>
                  <Button
                    variant="default"
                    className={`ml-2 ${ButtonConfig.backgroundColor} ${ButtonConfig.hoverBackgroundColor} ${ButtonConfig.textColor}`}
                    onClick={() => {
                      navigate("/purchase/create");
                    }}
                  >
                    <SquarePlus className="h-4 w-4 mr-2" /> Purchase
                  </Button>{" "}
                </>
              )}
            </div>
          </div>
          {/* table  */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead
                          key={header.id}
                          className={` ${ButtonConfig.tableHeader} ${ButtonConfig.tableLabel}`}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {/* row slection and pagintaion button  */}
          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              Total Purchase : &nbsp;
              {table.getFilteredRowModel().rows.length}
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
};

export default PurchaseList;
