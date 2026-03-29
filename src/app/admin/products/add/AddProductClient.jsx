"use client";

import Image from "next/image";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CloudUpload,
  Loader2,
  PlusCircle,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { uploadImageDataUrl } from "@/lib/cloudinaryUpload";
import { moveProductImageToFront } from "@/lib/productImages";
import { getBlurPlaceholderProps } from "@/lib/imagePlaceholder";
import { cn } from "@/lib/utils";

const selectionChipClass = (selected) =>
  cn(
    "inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
    selected
      ? "border-primary bg-primary text-primary-foreground shadow-[0_12px_30px_rgba(10,61,46,0.14)]"
      : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground"
  );

const uploadActionClass =
  "relative overflow-hidden inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

export default function AddProduct() {
  const router = useRouter();

  const [Name, setName] = useState("");
  const [Description, setDescription] = useState("");
  const [Price, setPrice] = useState("");
  const [Categories, setCategories] = useState([]); // array of selected category ids
  const [images, setImages] = useState([]); // Array of { url, file }
  const [isLive, setIsLive] = useState(true);
  const [isNewArrival, setIsNewArrival] = useState(true);
  const [isBestSelling, setIsBestSelling] = useState(false);

  const [isDragOver, setIsDragOver] = useState(false);
  const [allCategories, setAllCategories] = useState([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatImage, setNewCatImage] = useState("");
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        if (data.success) setAllCategories(data.data);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, []);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setIsAddingCat(true);
    try {
      let uploadedCategoryImage = "";
      let uploadedCategoryImagePublicId = "";
      let uploadedCategoryBlurDataURL = "";
      if (newCatImage) {
        const uploaded = await uploadImageDataUrl(
          newCatImage,
          "kifayatly_categories"
        );
        uploadedCategoryImage = uploaded.url;
        uploadedCategoryImagePublicId = uploaded.publicId;
        uploadedCategoryBlurDataURL = uploaded.blurDataURL;
      }

      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCatName.trim(),
          image: uploadedCategoryImage,
          imagePublicId: uploadedCategoryImagePublicId,
          blurDataURL: uploadedCategoryBlurDataURL,
          imageDataUrl: newCatImage || "",
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Category added!");
        setNewCatName("");
        setNewCatImage("");
        setIsCategoryModalOpen(false);
        const refreshRes = await fetch("/api/categories");
        const refreshData = await refreshRes.json();
        if (refreshData.success) setAllCategories(refreshData.data);
      } else {
        toast.error(data.error || "Failed to add category");
      }
    } catch {
      toast.error("Error adding category");
    } finally {
      setIsAddingCat(false);
    }
  };

  const handleCategoryImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => setNewCatImage(ev.target?.result || "");
    reader.readAsDataURL(file);
  };

  const toggleCategory = (categoryId) => {
    setCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((c) => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);
  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const processFiles = (filesList) => {
    const validFiles = Array.from(filesList).filter((f) =>
      f.type.startsWith("image/")
    );
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImages((prev) => [...prev, { url: ev.target.result, file }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    processFiles(e.dataTransfer.files);
  }, []);

  const handleFileSelect = (e) => {
    processFiles(e.target.files);
    e.target.value = null;
  };

  const removeImage = (indexToRemove) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const makeImagePrimary = (indexToMove) => {
    setImages((prev) => moveProductImageToFront(prev, indexToMove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!Name || !Price || Categories.length === 0 || images.length === 0) {
      toast.error("Name, Price, Category and at least one Image are required.");
      return;
    }

    setSaving(true);
    const finalImages = [];
    try {
      for (const img of images) {
        const uploaded = await uploadImageDataUrl(
          img.url,
          "kifayatly_products"
        );
        finalImages.push(uploaded);
      }
    } catch (err) {
      toast.error("Image upload failed");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Name,
          Description,
          Price: Number(Price),
          Images: finalImages,
          Category: Categories,
          isLive,
          isNewArrival,
          isBestSelling,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Product created!");
        router.push("/admin/products");
      } else {
        toast.error(data.message || data.error || "Failed to create product");
      }
    } catch {
      toast.error("Network error while saving.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full pb-10">
      <div className="mb-6 md:mb-8 flex items-center gap-4">
        <Link
          href="/admin/products"
          className={cn(
            buttonVariants({ variant: "outline", size: "icon-sm" }),
            "rounded-xl"
          )}
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">
            Add New Product
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            List a new item in your store catalog.
          </p>
        </div>
      </div>

      <div className="surface-card max-w-2xl rounded-xl p-4 shadow-lg md:p-8">
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <div>
            <Label className="mb-2">Product Name</Label>
            <Input
              type="text"
              value={Name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 px-4"
              placeholder="e.g., Luxury Tea Set"
              required
            />
          </div>

          <div>
            <Label className="mb-2">Price (Rs)</Label>
            <Input
              type="number"
              value={Price}
              onChange={(e) => setPrice(e.target.value)}
              className="h-11 px-4"
              placeholder="0.00"
              step="0.01"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Categories</Label>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition-colors hover:text-primary/80"
              >
                <PlusCircle className="size-3.5" /> Manage Categories
              </button>
            </div>
            <div className="flex min-h-[52px] flex-wrap gap-2 rounded-xl border border-border bg-muted/35 p-3">
              {allCategories.length === 0 ? (
                <p className="self-center text-xs text-muted-foreground">
                  No categories found. Add one.
                </p>
              ) : (
                allCategories.map((cat) => {
                  const selected = Categories.includes(cat._id);
                  return (
                    <button
                      key={cat._id}
                      type="button"
                      onClick={() => toggleCategory(cat._id)}
                      className={selectionChipClass(selected)}
                    >
                      {selected && <Check className="mr-1 size-3" />}
                      {cat.name}
                    </button>
                  );
                })
              )}
            </div>
            {Categories.length === 0 && (
              <p className="mt-1 text-xs text-destructive/80">
                Please select at least one category.
              </p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/35 p-4">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Publish as Live
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {isLive
                  ? "🟢 Will be visible to customers immediately"
                  : "🔴 Draft — hidden from store until toggled Live"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsLive(!isLive)}
              className={cn(
                "relative h-5 w-10 rounded-lg transition-colors duration-300",
                isLive ? "bg-primary" : "bg-border"
              )}
            >
              <span
                className={cn(
                  "absolute left-0.5 top-0.5 h-4 w-4 rounded-md bg-background shadow transition-transform duration-300",
                  isLive ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>

          {/* Marketing Flags */}
          <div className="rounded-xl border border-border bg-muted/35 p-4 space-y-4">
            <p className="text-sm font-semibold text-foreground">Marketing Flags</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-4 sm:border-0 sm:pb-0">
                <Label className="text-xs text-muted-foreground mr-2 cursor-pointer" htmlFor="toggle-new">New Arrival</Label>
                <button
                  id="toggle-new"
                  type="button"
                  onClick={() => setIsNewArrival(!isNewArrival)}
                  className={cn(
                    "relative h-5 w-10 rounded-lg transition-colors duration-300",
                    isNewArrival ? "bg-primary" : "bg-border",
                  )}
                >
                  <span className={cn("absolute left-0.5 top-0.5 h-4 w-4 rounded-md bg-background shadow transition-transform duration-300", isNewArrival ? "translate-x-5" : "translate-x-0")} />
                </button>
              </div>
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs text-muted-foreground mr-2 cursor-pointer" htmlFor="toggle-best">Best Selling</Label>
                <button
                  id="toggle-best"
                  type="button"
                  onClick={() => setIsBestSelling(!isBestSelling)}
                  className={cn(
                    "relative h-5 w-10 rounded-lg transition-colors duration-300",
                    isBestSelling ? "bg-primary" : "bg-border",
                  )}
                >
                  <span className={cn("absolute left-0.5 top-0.5 h-4 w-4 rounded-md bg-background shadow transition-transform duration-300", isBestSelling ? "translate-x-5" : "translate-x-0")} />
                </button>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Product Images</Label>
              <div className={uploadActionClass}>
                <PlusCircle className="size-3.5" /> Add Images
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted/40"
                >
                  <Image
                    src={img.url}
                    alt="Preview"
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover"
                    {...getBlurPlaceholderProps(img.blurDataURL)}
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-background/95 text-destructive shadow-sm opacity-0 transition-all hover:bg-destructive hover:text-destructive-foreground group-hover:opacity-100"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                  {idx !== 0 ? (
                    <button
                      type="button"
                      onClick={() => makeImagePrimary(idx)}
                      className="absolute bottom-2 left-2 rounded-md border border-border bg-background/95 px-2 py-1 text-[10px] font-bold text-foreground shadow-sm opacity-0 transition-all hover:border-primary hover:text-primary group-hover:opacity-100"
                    >
                      Set Main
                    </button>
                  ) : null}
                  {idx === 0 ? (
                    <span className="absolute bottom-2 left-2 rounded-md bg-foreground/80 px-2 py-0.5 text-[10px] font-bold text-background shadow-sm">
                      Main Image
                    </span>
                  ) : null}
                </div>
              ))}
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "relative cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200",
                isDragOver
                  ? "border-primary bg-primary/8"
                  : "border-border bg-muted/20 hover:border-primary/35 hover:bg-muted/35"
              )}
            >
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CloudUpload className="size-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Drag & Drop Images Here
                  </p>
                  <p className="text-xs text-muted-foreground">
                    or click to browse multiple files
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label className="mb-2">Description</Label>
            <Textarea
              value={Description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-28 resize-none px-4 py-3"
              placeholder="Enter product description..."
              rows="4"
            />
          </div>

          <div className="flex gap-4 mt-6 md:mt-8">
            <Button
              type="submit"
              disabled={saving}
              size="lg"
              className="flex-1 rounded-xl font-bold"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Product"
              )}
            </Button>
            <Link href="/admin/products" className="flex-1">
              <Button
                variant="outline"
                size="lg"
                className="w-full rounded-xl font-bold"
                type="button"
              >
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
