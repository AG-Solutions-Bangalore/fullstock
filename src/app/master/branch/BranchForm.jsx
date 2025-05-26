import { BRANCH_CREATE, BRANCH_EDIT_GET, BRANCH_EDIT_SUMBIT } from "@/api";
import apiClient from "@/api/axios";
import usetoken from "@/api/usetoken";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ButtonConfig } from "@/config/ButtonConfig";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Edit, Loader2, SquarePlus } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const BranchForm = ({ branchId }) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const isEditMode = !!branchId;
  const [formData, setFormData] = useState({
    branch_name: isEditMode ? null : "",
    branch_prefix: isEditMode ? null : "",
    branch_whatsapp: "",
    branch_email: "",
    branch_s_unit: "",
    branch_d_unit: "",
    branch_status: isEditMode ? "" : null,
  });
  const [originalData, setOriginalData] = useState(null);
  const token = usetoken();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { pathname } = useLocation();

  // Fetch existing data if editing
  useEffect(() => {
    if (isEditMode && open) {
      const fetchBranch = async () => {
        setIsFetching(true);
        try {
          const { data } = await apiClient.get(
            `${BRANCH_EDIT_GET}/${branchId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          const branch = data?.branch || {};
          const filledData = {
            branch_name: branch.branch_name || "",
            branch_whatsapp: branch.branch_whatsapp || "",
            branch_email: branch.branch_email || "",
            branch_status: branch.branch_status || "",
            branch_d_unit: branch.branch_d_unit || "",
            branch_s_unit: branch.branch_s_unit || "",
          };

          setFormData(filledData);
          setOriginalData(filledData);
        } catch (err) {
          toast({
            title: "Error",
            description: "Failed to fetch branch details",
            variant: "destructive",
          });
          setOpen(false);
        } finally {
          setIsFetching(false);
        }
      };

      fetchBranch();
    }
  }, [open, branchId]);

  const handleSubmit = async () => {
    const missingFields = [];

    if (isEditMode) {
      if (!formData.branch_whatsapp) missingFields.push("Branch Whatsapp");
      if (!formData.branch_email) missingFields.push("Branch Email");
      if (!formData.branch_status) missingFields.push("Status");
      if (!formData.branch_s_unit) missingFields.push("Single Unit");
      if (!formData.branch_d_unit) missingFields.push("DOuble Unit");
      if (formData.branch_d_unit == "No" && formData.branch_s_unit == "No")
        missingFields.push("Both Unit Cannot be No");
    } else {
      if (!formData.branch_name) missingFields.push("Branch Name");
      if (!formData.branch_prefix) missingFields.push("Branch Name");
      if (!formData.branch_whatsapp) missingFields.push("Branch Whatsapp");
      if (!formData.branch_email) missingFields.push("Branch Email");
      if (!formData.branch_s_unit) missingFields.push("Single Unit");
      if (!formData.branch_d_unit) missingFields.push("DOuble Unit");
      if (formData.branch_d_unit == "No" && formData.branch_s_unit == "No")
        missingFields.push("Both Unit Cannot be No");
    }

    if (missingFields.length > 0) {
      toast({
        title: "Validation Error",
        description: (
          <div>
            <p>Please fill in the following fields:</p>
            <ul className="list-disc pl-5">
              {missingFields.map((field, index) => (
                <li key={index}>{field}</li>
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
      const url = isEditMode
        ? `${BRANCH_EDIT_SUMBIT}/${branchId}`
        : BRANCH_CREATE;
      const method = isEditMode ? "put" : "post";

      const response = await apiClient[method](url, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response?.data.code == 200) {
        toast({
          title: "Success",
          description: response.data.msg,
        });

        await queryClient.invalidateQueries(["branches"]);
        setOpen(false);
        if (!isEditMode) {
          setFormData({
            branch_name: "",
            branch_prefix: "",
            branch_whatsapp: "",
            branch_email: "",
          });
        }
      } else {
        toast({
          title: "Error",
          description: response.data.msg,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Operation failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleSelectChange = (field) => (value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  const hasChanges =
    originalData &&
    (formData.branch_whatsapp !== originalData.branch_whatsapp ||
      formData.branch_email !== originalData.branch_email ||
      formData.branch_s_unit !== originalData.branch_s_unit ||
      formData.branch_d_unit !== originalData.branch_d_unit ||
      formData.branch_status !== originalData.branch_status);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {isEditMode ? (
          <div>
            <div className="sm:hidden">
              <button
                variant="default"
                className={`px-2 py-1 bg-yellow-400 hover:bg-yellow-600 rounded-lg text-black text-xs`}
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
            <div className="hidden sm:block">
              <Button
                variant="ghost"
                size="icon"
                className={`transition-all duration-200 ${
                  isHovered ? "bg-blue-50" : ""
                }`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                <Edit
                  className={`h-4 w-4 transition-all duration-200 ${
                    isHovered ? "text-blue-500" : ""
                  }`}
                />
              </Button>
            </div>
          </div>
        ) : pathname === "/master/branch" ? (
          <div>
            <div className="sm:hidden">
              <Button
                onClick={() => setOpen(true)}
                variant="default"
                className={`md:ml-2 bg-yellow-400 hover:bg-yellow-600 text-black rounded-l-full`}
              >
                <SquarePlus className="h-4 w-4" /> Buyer
              </Button>
            </div>
            <div className="hidden sm:block">
              <Button
                onClick={() => setOpen(true)}
                variant="default"
                className={`md:ml-2 ${ButtonConfig.backgroundColor} ${ButtonConfig.hoverBackgroundColor} ${ButtonConfig.textColor}`}
              >
                <SquarePlus className="h-4 w-4 mr-2" /> Buyer
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            className="text-red-600 cursor-default"
            disabled
          >
            Buyer<span className="text-red-500 ml-1">*</span>
          </Button>
        )}
      </PopoverTrigger>

      <PopoverContent className="md:w-80">
        {isFetching ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">
                {isEditMode ? "Update Branch" : "Create New Branch"}
              </h4>
              <p className="text-sm text-muted-foreground">
                {isEditMode
                  ? "Edit the details for the branch"
                  : "Enter the details for the new branch"}
              </p>
            </div>
            <div className="grid gap-2">
              {!isEditMode && (
                <>
                  <div>
                    <label
                      htmlFor="branch_name"
                      className="text-sm font-medium"
                    >
                      Branch Name *
                    </label>
                    <Input
                      placeholder="Enter Branch Name"
                      value={formData.branch_name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          branch_name: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="branch_prefix"
                      className="text-sm font-medium"
                    >
                      Branch Prefix *
                    </label>
                    <Input
                      placeholder="Enter Branch Prefix"
                      maxLength={2}
                      value={formData.branch_prefix}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.length <= 2) {
                          setFormData((prev) => ({
                            ...prev,
                            branch_prefix: value,
                          }));
                        }
                      }}
                    />
                  </div>
                </>
              )}
              <div>
                <label
                  htmlFor="branch_whatsapp"
                  className="text-sm font-medium"
                >
                  Branch Whatsapp *
                </label>
                <Input
                  placeholder="Enter Branch Whatsapp"
                  value={formData.branch_whatsapp}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d{0,10}$/.test(value)) {
                      setFormData((prev) => ({
                        ...prev,
                        branch_whatsapp: value,
                      }));
                    }
                  }}
                />
              </div>
              <div>
                <label htmlFor="branch_email" className="text-sm font-medium">
                  Branch Email *
                </label>
                <Input
                  type="email"
                  placeholder="Enter Branch Email"
                  value={formData.branch_email}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      branch_email: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1">
                  <label
                    htmlFor="branch_s_unit"
                    className="text-sm font-medium"
                  >
                    S Unit *
                  </label>
                  <Select
                    value={formData.branch_s_unit}
                    onValueChange={handleSelectChange("branch_s_unit")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select S Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                          Yes
                        </div>
                      </SelectItem>
                      <SelectItem value="No">
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-gray-400 mr-2" />
                          No
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1">
                  <label
                    htmlFor="branch_d_unit"
                    className="text-sm font-medium"
                  >
                    D Unit *
                  </label>
                  <Select
                    value={formData.branch_d_unit}
                    onValueChange={handleSelectChange("branch_d_unit")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select D Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                          Yes
                        </div>
                      </SelectItem>
                      <SelectItem value="No">
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-gray-400 mr-2" />
                          No
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {isEditMode && (
                <>
                  <div className="grid gap-1">
                    <label
                      htmlFor="branch_status"
                      className="text-sm font-medium"
                    >
                      Status *
                    </label>
                    <Select
                      value={formData.branch_status}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          branch_status: value,
                        }))
                      }
                    >
                      <SelectTrigger
                        className={hasChanges ? "border-blue-200" : ""}
                      >
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">
                          <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                            Active
                          </div>
                        </SelectItem>
                        <SelectItem value="Inactive">
                          <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-gray-400 mr-2" />
                            Inactive
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {hasChanges && (
                    <Alert className="bg-blue-50 border-blue-200 mt-2">
                      <AlertCircle className="h-4 w-4 text-blue-500" />
                      <AlertDescription className="text-blue-600 text-sm">
                        You have unsaved changes
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
              <Button
                onClick={handleSubmit}
                disabled={isEditMode ? !hasChanges : isLoading}
                className={`mt-2 ${ButtonConfig.backgroundColor} ${ButtonConfig.hoverBackgroundColor} ${ButtonConfig.textColor}`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditMode ? "Updating..." : "Creating..."}
                  </>
                ) : isEditMode ? (
                  "Update Branch"
                ) : (
                  "Create Branch"
                )}
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default BranchForm;
