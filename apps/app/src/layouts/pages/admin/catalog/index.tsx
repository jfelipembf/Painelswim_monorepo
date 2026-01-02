import { useState } from "react";

// @mui material components
import Grid from "@mui/material/Grid";

// Material Dashboard 2 PRO React TS examples
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

import { useToast } from "context/ToastContext";

import { useConfirmDialog } from "hooks/useConfirmDialog";

import { useProducts, type Product } from "hooks/products";
import { useServices, type Service } from "hooks/services";

// Forms (UI only)
import CatalogList from "layouts/pages/admin/catalog/components/CatalogList";
import ProductForm from "layouts/pages/admin/catalog/components/ProductForm";
import ServiceForm from "layouts/pages/admin/catalog/components/ServiceForm";
import { ConfirmDialog } from "components";

import type { CatalogItem, CatalogTab } from "./types";

function CatalogPage(): JSX.Element {
  const [tab, setTab] = useState<CatalogTab>("products");

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const toast = useToast();
  const confirmDialog = useConfirmDialog();

  const productsHook = useProducts();
  const servicesHook = useServices();

  const loading = tab === "products" ? productsHook.loading : servicesHook.loading;
  const error = tab === "products" ? productsHook.error : servicesHook.error;
  const products = productsHook.products;
  const services = servicesHook.services;

  const isProductsTab = tab === "products";
  const items = isProductsTab ? products : services;

  const handleEditItem = (item: CatalogItem) => {
    if (isProductsTab) {
      setSelectedProduct(item as Product);
    } else {
      setSelectedService(item as Service);
    }
  };

  const handleDeleteItem = (item: CatalogItem) => {
    void (async () => {
      const ok = await confirmDialog.confirm({
        title: isProductsTab ? "Excluir produto?" : "Excluir serviço?",
        description: "Esta ação não pode ser desfeita.",
        confirmLabel: "Excluir",
        cancelLabel: "Cancelar",
        confirmColor: "error",
      });
      if (!ok) return;

      try {
        if (isProductsTab) {
          await productsHook.remove(item.id);
          if (selectedProduct?.id === item.id) setSelectedProduct(null);
          toast.showSuccess("Produto excluído.");
        } else {
          await servicesHook.remove(item.id);
          if (selectedService?.id === item.id) setSelectedService(null);
          toast.showSuccess("Serviço excluído.");
        }
      } catch (e: any) {
        toast.showError(e?.message || "Erro ao excluir item.");
      }
    })();
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3} px={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={4}>
            <CatalogList
              tab={tab}
              items={items}
              loading={loading}
              error={error}
              onTabChange={(nextTab) => {
                setSelectedProduct(null);
                setSelectedService(null);
                setTab(nextTab);
              }}
              onEdit={handleEditItem}
              onDelete={handleDeleteItem}
            />
          </Grid>

          <Grid item xs={12} lg={8}>
            {isProductsTab ? (
              <ProductForm
                saving={false}
                error={null}
                initialData={selectedProduct}
                onCancel={() => setSelectedProduct(null)}
                onSubmit={async (values) => {
                  try {
                    if (selectedProduct?.id) {
                      await productsHook.update(selectedProduct.id, values);
                      toast.showSuccess("Produto salvo.");
                    } else {
                      await productsHook.create(values);
                      toast.showSuccess("Produto criado.");
                    }
                    setSelectedProduct(null);
                  } catch (e: any) {
                    toast.showError(e?.message || "Erro ao salvar produto.");
                  }
                }}
              />
            ) : (
              <ServiceForm
                saving={false}
                error={null}
                initialData={selectedService}
                onCancel={() => setSelectedService(null)}
                onSubmit={async (values) => {
                  try {
                    if (selectedService?.id) {
                      await servicesHook.update(selectedService.id, values);
                      toast.showSuccess("Serviço salvo.");
                    } else {
                      await servicesHook.create(values);
                      toast.showSuccess("Serviço criado.");
                    }
                    setSelectedService(null);
                  } catch (e: any) {
                    toast.showError(e?.message || "Erro ao salvar serviço.");
                  }
                }}
              />
            )}
          </Grid>
        </Grid>
      </MDBox>
      <Footer />

      <ConfirmDialog
        {...confirmDialog.dialogProps}
        onCancel={confirmDialog.handleCancel}
        onConfirm={confirmDialog.handleConfirm}
      />
    </DashboardLayout>
  );
}

export default CatalogPage;
