import { fetchPurchaseById, PURCHASE_CREATE, PURCHASE_EDIT_LIST } from "@/api";
import apiClient from "@/api/axios";
import usetoken from "@/api/usetoken";
import Page from "@/app/dashboard/page";
import { MemoizedProductSelect } from "@/components/common/MemoizedProductSelect";
import { MemoizedSelect } from "@/components/common/MemoizedSelect";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ButtonConfig } from "@/config/ButtonConfig";
import { useToast } from "@/hooks/use-toast";
import {
  useFetchBuyers,
  useFetchGoDown,
  useFetchItems,
  useFetchPurchaseRef,
} from "@/hooks/useApi";
import { ArrowLeft, MinusCircle, PlusCircle, SquarePlus } from "lucide-react";
import moment from "moment";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BuyerForm from "../master/buyer/CreateBuyer";
import CreateItem from "../master/item/CreateItem";
import { useQuery } from "@tanstack/react-query";
import { decryptId } from "@/components/common/Encryption";
const BranchHeader = () => {
  return (
    <div
      className={`flex sticky top-0 z-10 border border-gray-200 rounded-lg justify-between items-start gap-8 mb-2 ${ButtonConfig.cardheaderColor} p-4 shadow-sm`}
    >
      <div className="flex-1">
        <h1 className="text-lg font-bold text-gray-800">Create Purchase</h1>
      </div>
    </div>
  );
};

const CreatePurchase = () => {
  const { id } = useParams();
  const decryptedId = decryptId(id);

  const editId = Boolean(id);
  const { toast } = useToast();
  const navigate = useNavigate();
  const boxInputRefs = useRef([]);
  const today = moment().format("YYYY-MM-DD");
  const [isLoading, setIsLoading] = useState(false);
  const token = usetoken();

  const [formData, setFormData] = useState({
    purchase_date: today,
    purchase_buyer_id: "",
    purchase_ref_no: "",
    purchase_vehicle_no: "",
    purchase_remark: "",
    purchase_status: editId ? "" : null,
  });

  const [invoiceData, setInvoiceData] = useState([
    {
      purchase_sub_item_id: "",
      purchase_sub_godown_id: "",
      purchase_sub_box: "",
      item_brand: "",
      item_size: "",
      avaiable_box: "",
    },
  ]);
  const addRow = useCallback(() => {
    setInvoiceData((prev) => [
      ...prev,
      {
        purchase_sub_item_id: "",
        purchase_sub_godown_id: "",
        purchase_sub_box: "",
      },
    ]);
  }, []);
  const removeRow = useCallback(
    (index) => {
      if (invoiceData.length > 1) {
        setInvoiceData((prev) => prev.filter((_, i) => i !== index));
      }
    },
    [invoiceData.length]
  );
  const focusBoxInput = (rowIndex) => {
    if (boxInputRefs.current[rowIndex]) {
      boxInputRefs.current[rowIndex].focus();
    }
  };
  const {
    data: purchaseByid,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["purchaseByid", id],
    queryFn: () => fetchPurchaseById(id, token),
    enabled: !!id,
  });
  console.log(purchaseByid, "purchaseByid");
  useEffect(() => {
    if (editId && purchaseByid?.purchase) {
      console.log("daata");
      setFormData({
        purchase_date: purchaseByid.purchase.purchase_date || "",
        purchase_buyer_name: purchaseByid.buyer.buyer_name || "",
        purchase_buyer_id: purchaseByid.purchase.purchase_buyer_id || "",
        purchase_buyer_city: purchaseByid.buyer.buyer_city || "",
        purchase_ref_no: purchaseByid.purchase.purchase_ref_no || "",
        purchase_vehicle_no: purchaseByid.purchase.purchase_vehicle_no || "",
        purchase_remark: purchaseByid.purchase.purchase_remark || "",
        purchase_status: purchaseByid.purchase.purchase_status || "",
      });

      // Set invoice line items
      const mappedData = Array.isArray(purchaseByid.purchaseSub)
        ? purchaseByid.purchaseSub.map((sub) => ({
            purchase_sub_item_id: sub.purchase_sub_item_id || "",
            purchase_sub_box: sub.purchase_sub_box || "",
            item_brand: sub.item_brand || "",
            item_size: sub.item_size || "",
            purchase_sub_item: sub.item_name || "",
            purchase_sub_weight: sub.item_weight || "",
            purchase_sub_godown_id: sub.purchase_sub_godown_id, // fill this from UI or skip if not needed
            avaiable_box: "", // you can fetch this later based on item/brand/size if needed
          }))
        : [
            {
              purchase_sub_item_id: "",
              purchase_sub_box: "",
              item_brand: "",
              item_size: "",
              purchase_sub_item: "",
              purchase_sub_weight: "",
              purchase_sub_godown_id: "",
              avaiable_box: "",
            },
          ];

      setInvoiceData(mappedData);
    }
  }, [editId, purchaseByid]);

  const { data: buyerData } = useFetchBuyers();
  const { data: itemsData } = useFetchItems();
  const { data: godownData } = useFetchGoDown();
  const { data: purchaseRef } = useFetchPurchaseRef();

  const handlePaymentChange = (selectedValue, rowIndex, fieldName) => {
    let value;

    if (selectedValue && selectedValue.target) {
      value = selectedValue.target.value;
    } else {
      value = selectedValue;
    }
    const updatedData = [...invoiceData];

    if (fieldName == "purchase_sub_item_id") {
      updatedData[rowIndex][fieldName] = value;
      const selectedItem = itemsData?.items?.find((item) => item.id == value);
      console.log(selectedItem, "selectedItem");
      if (selectedItem) {
        updatedData[rowIndex]["item_size"] = selectedItem.item_size;
        updatedData[rowIndex]["item_brand"] = selectedItem.item_brand;
        updatedData[rowIndex]["avaiable_box"] =
          Number(selectedItem.openpurch) -
          Number(selectedItem.closesale) +
          (Number(selectedItem.purch) - Number(selectedItem.sale));
      }

      focusBoxInput(rowIndex);

      setInvoiceData(updatedData);
    } else {
      if (["purchase_sub_box"].includes(fieldName)) {
        if (!/^\d*$/.test(value)) {
          console.log("Invalid input. Only digits are allowed.");
          return;
        }
      }

      updatedData[rowIndex][fieldName] = value;
      setInvoiceData(updatedData);
    }
  };

  const handleInputChange = (e, field) => {
    const value = e.target ? e.target.value : e;
    console.log(value);
    let updatedFormData = { ...formData, [field]: value };

    setFormData(updatedFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const missingFields = [];
    if (!formData.purchase_date) missingFields.push("Purchase Date");
    if (!formData.purchase_buyer_id) missingFields.push("Buyer Id");
    if (!formData.purchase_ref_no) missingFields.push("Bill Ref No");
    if (!formData.purchase_status && editId) {
      missingFields.push("Status");
    }
    invoiceData.forEach((row, index) => {
      if (!row.purchase_sub_godown_id)
        missingFields.push(`Row ${index + 1}: Go Down`);
      if (!row.purchase_sub_item_id)
        missingFields.push(`Row ${index + 1}: Item`);

      if (
        row.purchase_sub_box === null ||
        row.purchase_sub_box === undefined ||
        row.purchase_sub_box === ""
      ) {
        missingFields.push(`Row ${index + 1}: Box`);
      }
    });

    if (missingFields.length > 0) {
      toast({
        title: "Validation Error",
        description: (
          <div>
            <p>Please fill in the following fields:</p>
            <ul className="list-disc pl-5">
              {missingFields.map((field, i) => (
                <li key={i}>{field}</li>
              ))}
            </ul>
          </div>
        ),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        purchase_product_data: invoiceData,
      };

      if (editId) {
        payload.item_status = formData.item_status;
      }

      const response = await apiClient.post(
        editId ? `${PURCHASE_EDIT_LIST}/${decryptedId}` : PURCHASE_CREATE,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response?.data.code == 200) {
        toast({
          title: "Success",
          description: response.data.msg,
        });
      } else {
        toast({
          title: "Error",
          description: response.data.msg,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.log(error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to save item",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Page>
      <div className="p-0 md:p-4">
        <div className="sm:hidden bg-gradient-to-b from-yellow-50 to-white min-h-screen">
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            {/* Premium Header Section */}
            <div className="bg-gradient-to-r from-yellow-600 to-yellow-400 text-white shadow-lg relative overflow-hidden">
              {/* Decorative circles */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full"></div>
              <div className="absolute top-10 -right-20 w-40 h-40 bg-white/5 rounded-full"></div>

              <div className="flex items-center px-4 py-5 relative z-10">
                <button
                  type="button"
                  onClick={() => navigate("/purchase")}
                  className="p-1.5 bg-white/20 rounded-full text-white mr-3 shadow-sm hover:bg-white/30 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex flex-col">
                  <h1 className="text-lg font-bold tracking-wide">
                    Create Purchase
                  </h1>
                  <p className="text-xs text-yellow-100 mt-0.5 opacity-90">
                    Add new purchase details
                  </p>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="p-2">
              {/* Date and Buyer Row */}
              <div className="bg-white rounded-xl shadow-sm p-4 mb-4 border border-yellow-100">
                <div className="mb-4">
                  <label className="sm:block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1 h-4 bg-yellow-500 rounded-full mr-2"></span>
                    Date<span className="text-red-500">*</span>
                  </label>
                  <Input
                    className="bg-white border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400"
                    value={formData.purchase_date}
                    onChange={(e) => handleInputChange(e, "purchase_date")}
                    type="date"
                  />
                </div>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-gray-700 flex items-center">
                      <span className="w-1 h-4 bg-yellow-500 rounded-full mr-2"></span>
                      Buyer<span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      className="flex items-center text-xs text-yellow-600 font-medium bg-yellow-50 px-2 py-0.5 rounded-full"
                    >
                      <SquarePlus className="h-3 w-3 mr-1" />
                      <BuyerForm />
                    </button>
                  </div>
                  <MemoizedSelect
                    value={formData.purchase_buyer_id}
                    onChange={(e) => handleInputChange(e, "purchase_buyer_id")}
                    options={
                      buyerData?.buyers?.map((buyer) => ({
                        value: buyer.id,
                        label: buyer.buyer_name,
                      })) || []
                    }
                    placeholder="Select Buyer"
                    className="bg-white focus:ring-2 focus:ring-yellow-300"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="sm:block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1 h-4 bg-yellow-500 rounded-full mr-2"></span>
                      Ref No<span className="text-red-500">*</span>
                    </label>

                    <MemoizedSelect
                      value={formData.purchase_ref_no}
                      onChange={(e) => handleInputChange(e, "purchase_ref_no")}
                      options={
                        purchaseRef
                          ? [
                              {
                                value: purchaseRef.purchase_ref,
                                label: purchaseRef.purchase_ref,
                              },
                            ]
                          : []
                      }
                      placeholder="Select Ref"
                      className="bg-white focus:ring-2 focus:ring-yellow-300"
                    />
                  </div>
                  <div>
                    <label className="sm:block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <span className="w-1 h-4 bg-gray-300 rounded-full mr-2"></span>
                      Vehicle No
                    </label>
                    <Input
                      className="bg-white border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400"
                      value={formData.purchase_vehicle_no}
                      onChange={(e) =>
                        handleInputChange(e, "purchase_vehicle_no")
                      }
                      placeholder="Vehicle No"
                    />
                  </div>
                </div>

                <div>
                  <label className="sm:block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <span className="w-1 h-4 bg-gray-300 rounded-full mr-2"></span>
                    Remark
                  </label>
                  <Textarea
                    className="bg-white border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400"
                    value={formData.purchase_remark}
                    onChange={(e) => handleInputChange(e, "purchase_remark")}
                    placeholder="Add any notes here"
                    rows={2}
                  />
                </div>
              </div>

              {/* Items Section  Table */}
              <div className="bg-white rounded-xl shadow-sm p-2 mb-4 border border-yellow-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <span className="w-1.5 h-5 bg-yellow-500 rounded-full mr-2"></span>
                    <h2 className="text-base font-semibold text-gray-800">
                      Items
                    </h2>
                    <button
                      type="button"
                      className="flex items-center text-xs text-yellow-600 font-medium bg-yellow-50 px-2 py-0.5 rounded-full"
                    >
                      <SquarePlus className="h-3 w-3 mr-1" />
                      <CreateItem />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={addRow}
                    className="flex items-center bg-yellow-500 text-white px-3 py-1.5 rounded-full text-xs shadow-sm hover:bg-yellow-600 transition-colors"
                  >
                    <PlusCircle className="h-3 w-3 mr-1" />
                    Add Item
                  </button>
                </div>

                {/*  Item Table */}
                <div className="overflow-hidden rounded-xl border border-yellow-200">
                  <Table className="w-full border-collapse">
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-yellow-100 to-yellow-50">
                        <TableHead className="text-xs font-semibold text-gray-700 py-3 px-4">
                          Item
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-gray-700 py-3 px-4">
                          Godown<span className="text-red-500 ml-1">*</span>
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-gray-700 py-3 px-4">
                          Box<span className="text-red-500 ml-1">*</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {invoiceData.map((row, rowIndex) => (
                        <TableRow
                          key={rowIndex}
                          className="border-b border-yellow-100 hover:bg-yellow-50 transition-colors relative"
                        >
                          {/* Item Select */}
                          <TableCell className="px-4 py-3 min-w-[200px] align-top">
                            <div className="space-y-1">
                              <MemoizedProductSelect
                                value={row.purchase_sub_item_id}
                                onChange={(e) =>
                                  handlePaymentChange(
                                    e,
                                    rowIndex,
                                    "purchase_sub_item_id"
                                  )
                                }
                                options={
                                  itemsData?.items?.map((product) => ({
                                    value: product.id,
                                    label: product.item_name,
                                  })) || []
                                }
                                placeholder="Select Item"
                                className="text-xs"
                              />
                              {row.item_size && (
                                <div className="text-xs text-gray-600 flex gap-2">
                                  <span className="bg-yellow-100 px-1.5 py-0.5 rounded text-yellow-800">
                                    {row.item_size}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Delete Row Button */}
                            <button
                              type="button"
                              onClick={() => removeRow(rowIndex)}
                              disabled={invoiceData.length === 1}
                              className={`absolute top-2 right-2 rounded-full p-1 ${
                                invoiceData.length === 1
                                  ? "bg-gray-200 text-gray-400"
                                  : "bg-red-100 text-red-500"
                              }`}
                            >
                              <MinusCircle className="h-4 w-4" />
                            </button>
                          </TableCell>

                          {/* Godown Select */}
                          <TableCell className="px-4 py-3 min-w-[150px] align-top">
                            <MemoizedProductSelect
                              value={row.purchase_sub_godown_id}
                              onChange={(e) =>
                                handlePaymentChange(
                                  e,
                                  rowIndex,
                                  "purchase_sub_godown_id"
                                )
                              }
                              options={
                                godownData?.godown?.map((godown) => ({
                                  value: godown.id,
                                  label: godown.godown,
                                })) || []
                              }
                              placeholder="Select Godown"
                              className="text-xs"
                            />
                          </TableCell>

                          {/* Box Input */}
                          <TableCell className="px-4 py-3 min-w-[150px] align-top">
                            <div className="space-y-1">
                              <Input
                                ref={(el) =>
                                  (boxInputRefs.current[rowIndex] = el)
                                }
                                className="bg-white border border-gray-300 w-full text-xs"
                                value={row.purchase_sub_box}
                                onChange={(e) =>
                                  handlePaymentChange(
                                    e,
                                    rowIndex,
                                    "purchase_sub_box"
                                  )
                                }
                                placeholder="Qty"
                                type="number"
                              />
                              {row.item_brand && (
                                <div className="text-xs text-gray-600">
                                  <span className="inline-block bg-gray-100 px-1.5 py-0.5 rounded">
                                    {row.item_brand}
                                  </span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Item count  */}
                <div className="mt-2 text-xs text-gray-500 flex items-center">
                  <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full mr-1"></span>
                  Total Items: {invoiceData.length}
                  {invoiceData.some((row) => row.purchase_sub_box) && (
                    <div className="flex items-center text-sm text-gray-700">
                      <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                      Available Box:&nbsp;
                      {invoiceData.find((row) => row.purchase_sub_box)
                        ?.avaiable_box || 0}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="mb-20">
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-yellow-600 to-yellow-400 hover:from-yellow-700 hover:to-yellow-500 text-white font-bold py-3.5 rounded-xl shadow-md transition-all transform hover:scale-[0.99]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <span className="animate-spin mr-2">⟳</span>
                      Processing...
                    </div>
                  ) : (
                    "CREATE PURCHASE"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>

        <div className="hidden sm:block">
          <form onSubmit={handleSubmit} className="w-full ">
            <BranchHeader />
            <Card className={`mb-6 ${ButtonConfig.cardColor}`}>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                  <div>
                    <div>
                      <label
                        className={`block  ${ButtonConfig.cardLabel} text-sm mb-2 font-medium `}
                      >
                        Date <span className="text-red-500">*</span>
                      </label>
                      <Input
                        className="bg-white"
                        value={formData.purchase_date}
                        onChange={(e) => handleInputChange(e, "purchase_date")}
                        placeholder="Enter Payment Date"
                        type="date"
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <label
                        className={`text-sm font-medium ${ButtonConfig.cardLabel}`}
                      >
                        Buyer <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        className="flex items-center text-xs font-medium text-yellow-700 bg-yellow-100 hover:bg-yellow-200 px-2 py-1 rounded-full transition-colors duration-150"
                      >
                        <SquarePlus className="h-3 w-3 mr-1" />

                        <BuyerForm />
                      </button>
                    </div>

                    <MemoizedSelect
                      value={formData.purchase_buyer_id}
                      onChange={(e) =>
                        handleInputChange(e, "purchase_buyer_id")
                      }
                      options={
                        buyerData?.buyers?.map((buyer) => ({
                          value: buyer.id,
                          label: buyer.buyer_name,
                        })) || []
                      }
                      placeholder="Select Buyer"
                      className="bg-white focus:ring-2 focus:ring-yellow-300"
                    />
                  </div>

                  <div>
                    <div>
                      <label
                        className={`block  ${ButtonConfig.cardLabel} text-sm mb-2 font-medium `}
                      >
                        Ref No<span className="text-red-500">*</span>
                      </label>

                      <MemoizedSelect
                        value={formData.purchase_ref_no}
                        onChange={(e) =>
                          handleInputChange(e, "purchase_ref_no")
                        }
                        options={
                          purchaseRef
                            ? [
                                {
                                  value: purchaseRef.purchase_ref,
                                  label: purchaseRef.purchase_ref,
                                },
                              ]
                            : []
                        }
                        placeholder="Select Ref"
                        className="bg-white focus:ring-2 focus:ring-yellow-300"
                      />
                    </div>
                  </div>
                  <div>
                    <div>
                      <label
                        className={`block  ${ButtonConfig.cardLabel} text-sm mb-2 font-medium `}
                      >
                        Vehicle No
                      </label>
                      <Input
                        className="bg-white"
                        value={formData.purchase_vehicle_no}
                        onChange={(e) =>
                          handleInputChange(e, "purchase_vehicle_no")
                        }
                        placeholder="Enter Vehicle No"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <div>
                    <label
                      className={`block  ${ButtonConfig.cardLabel} text-sm mb-2 font-medium `}
                    >
                      Remark
                    </label>
                    <Textarea
                      className="bg-white"
                      value={formData.purchase_remark}
                      onChange={(e) => handleInputChange(e, "purchase_remark")}
                      placeholder="Enter Remark"
                    />
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1">
                  <Table className="border border-gray-300 rounded-lg shadow-sm">
                    <TableHeader>
                      <TableRow className="bg-gray-100">
                        <TableHead className="text-sm font-semibold text-gray-600 px-4 py-3">
                          <div className="flex items-center justify-between">
                            <span>
                              Item
                              <span className="text-red-500 ml-1 text-xs">
                                *
                              </span>
                            </span>
                            <div className="flex items-center gap-1">
                              <SquarePlus className="h-4 w-4 text-red-600" />
                              <CreateItem />
                            </div>
                          </div>
                        </TableHead>

                        <TableHead className="text-sm font-semibold text-gray-600 px-4 py-3">
                          Godown
                          <span className="text-red-500 ml-1 text-xs">*</span>
                        </TableHead>

                        <TableHead className="text-sm font-semibold text-gray-600 px-4 py-3">
                          Box
                          <span className="text-red-500 ml-1 text-xs">*</span>
                        </TableHead>

                        <TableHead className="text-sm font-semibold text-gray-600 px-4 py-3 text-center w-1/6">
                          <div className="flex justify-center items-center gap-2">
                            Action
                            <PlusCircle
                              onClick={addRow}
                              className="cursor-pointer text-blue-500 hover:text-gray-800 h-4 w-4"
                            />
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {invoiceData.map((row, rowIndex) => (
                        <TableRow
                          key={rowIndex}
                          className="border-t border-gray-200 hover:bg-gray-50"
                        >
                          {/* Item Column */}
                          <TableCell className="px-4 py-3 align-top">
                            <div className="flex flex-col gap-1">
                              <MemoizedProductSelect
                                value={row.purchase_sub_item_id}
                                onChange={(e) =>
                                  handlePaymentChange(
                                    e,
                                    rowIndex,
                                    "purchase_sub_item_id"
                                  )
                                }
                                options={
                                  itemsData?.items?.map((product) => ({
                                    value: product.id,
                                    label: product.item_name,
                                  })) || []
                                }
                                placeholder="Select Item"
                              />
                              {row.item_size && (
                                <div className="text-xs text-gray-700">
                                  • {row.item_size}
                                </div>
                              )}
                            </div>
                          </TableCell>

                          {/* Godown Column */}
                          <TableCell className="px-4 py-3 align-top">
                            <div className="flex flex-col gap-1">
                              <MemoizedProductSelect
                                value={row.purchase_sub_godown_id}
                                onChange={(e) =>
                                  handlePaymentChange(
                                    e,
                                    rowIndex,
                                    "purchase_sub_godown_id"
                                  )
                                }
                                options={
                                  godownData?.godown?.map((godown) => ({
                                    value: godown.id,
                                    label: godown.godown,
                                  })) || []
                                }
                                placeholder="Select Godown"
                              />
                              {row.item_brand && (
                                <div className="text-xs text-gray-700">
                                  • {row.item_brand}
                                </div>
                              )}
                            </div>
                          </TableCell>

                          {/* Box Column */}
                          <TableCell className="px-4 py-3 align-top min-w-28">
                            <div className="flex flex-col gap-1">
                              <Input
                                className="bg-white border border-gray-300 text-sm"
                                value={row.purchase_sub_box}
                                onChange={(e) =>
                                  handlePaymentChange(
                                    e,
                                    rowIndex,
                                    "purchase_sub_box"
                                  )
                                }
                                placeholder="Enter Box"
                                type="number"
                              />
                              {row.purchase_sub_box && (
                                <div className="text-xs text-gray-700">
                                  • Available Box: {row.avaiable_box}
                                </div>
                              )}
                            </div>
                          </TableCell>

                          {/* Delete Button */}
                          <TableCell className="p-2 align-middle">
                            <Button
                              variant="ghost"
                              onClick={() => removeRow(rowIndex)}
                              disabled={invoiceData.length === 1}
                              className="text-red-500"
                              type="button"
                            >
                              <MinusCircle className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-row items-center gap-2 justify-end ">
              <Button
                type="submit"
                className={`${ButtonConfig.backgroundColor} ${ButtonConfig.hoverBackgroundColor} ${ButtonConfig.textColor} flex items-center mt-2`}
                disabled={isLoading}
              >
                {isLoading ? "Submitting..." : "Create Purchase"}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  navigate("/purchase");
                }}
                className={`${ButtonConfig.backgroundColor} ${ButtonConfig.hoverBackgroundColor} ${ButtonConfig.textColor} flex items-center mt-2`}
              >
                Go Back
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Page>
  );
};

export default CreatePurchase;
