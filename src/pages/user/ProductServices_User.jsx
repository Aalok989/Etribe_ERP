import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/user/Layout/DashboardLayout";
import { FiSearch, FiRefreshCw, FiBriefcase, FiImage, FiChevronLeft, FiChevronRight, FiPlus, FiX, FiFile, FiEye, FiEdit2 } from "react-icons/fi";
import { toast } from "react-toastify";
import api from "../../api/axiosConfig";
import { getAuthHeaders } from "../../utils/apiHeaders";
import RichTextEditor from '../../components/shared/RichTextEditor';

export default function ProductServices() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [sortField, setSortField] = useState("product");
  const [sortDirection, setSortDirection] = useState("asc");
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  
  // Product Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [productForm, setProductForm] = useState({
    hsnCode: '',
    productName: '',
    productImage: null,
    productDescription: ''
  });
  const [productSaving, setProductSaving] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const uid = localStorage.getItem("uid");
      
      if (!token) {
        toast.error("Please log in to view products");
        return;
      }

      console.log('Fetching products for user ID:', uid);
      
      const response = await api.get(`/product/get_product_details_by_id/${uid}`, {
        headers: getAuthHeaders()
      });
      
      console.log('Products API response:', response.data);
      
      let apiProducts = [];
      if (response.data?.data && Array.isArray(response.data.data)) {
        apiProducts = response.data.data;
      } else if (response.data?.data && typeof response.data.data === 'object') {
        // If single product object, wrap in array
        apiProducts = [response.data.data];
      } else if (response.data && Array.isArray(response.data)) {
        apiProducts = response.data;
      }
      
      const mappedProducts = apiProducts.map((product, index) => ({
        id: product.id || product.product_id || index + 1,
        company: product.company_name || product.company || '',
        product: product.product_name || product.product || '',
        hsnCode: product.hsn_code || '',
        description: product.product_description || product.description || '',
        image: product.product_image || product.image || '',
        userDetailId: product.user_detail_id || '',
        status: product.status || '',
        dtime: product.dtime || '',
        name: product.name || '',
        email: product.email || '',
        companyAddress: product.company_address || ''
      }));
      
      console.log('Mapped products:', mappedProducts);
      setProducts(mappedProducts);
    } catch (err) {
      console.error('Error fetching products:', err);
      console.error('Error response:', err.response?.data);
      toast.error('Failed to fetch products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    const filtered = products.filter(
      (product) =>
        (product.product || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.hsnCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedProducts = () => {
    const sorted = [...filteredProducts].sort((a, b) => {
      let aValue = a[sortField] || '';
      let bValue = b[sortField] || '';
      
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  };

  // Product Modal Functions
  const openProductModal = () => {
    setIsEditing(false);
    setEditingProductId(null);
    setShowProductModal(true);
    setProductForm({
      hsnCode: '',
      productName: '',
      productImage: null,
      productDescription: ''
    });
  };

  const closeProductModal = () => {
    setShowProductModal(false);
    setProductForm({
      hsnCode: '',
      productName: '',
      productImage: null,
      productDescription: ''
    });
  };

  const handleProductFormChange = (field, value) => {
    setProductForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleView = (product) => {
    setSelectedProduct(product);
    setShowViewModal(true);
  };

  const handleEdit = (product) => {
    setIsEditing(true);
    setEditingProductId(product.id);
    setShowProductModal(true);
    setProductForm({
      hsnCode: product.hsnCode || '',
      productName: product.product || '',
      productImage: null,
      productDescription: product.description || ''
    });
  };

  const handleProductSave = async () => {
    if (!productForm.hsnCode || !productForm.productName) {
      toast.error('Please fill in all required fields');
      return;
    }

    setProductSaving(true);
    try {
      const token = localStorage.getItem('token');
      const uid = localStorage.getItem('uid');
      
      if (isEditing && editingProductId) {
        // Build form data to match provided cURL for edit
        const editForm = new FormData();
        editForm.append('id', String(editingProductId));
        editForm.append('hsn_code', productForm.hsnCode);
        editForm.append('product_name', productForm.productName);
        editForm.append('product_description', productForm.productDescription);
        if (productForm.productImage) {
          // API edit expects 'file' field name
          editForm.append('file', productForm.productImage);
        }

        const editResponse = await api.post(`/product/edit/${editingProductId}`, editForm, {
          headers: getAuthHeaders()
        });

        console.log('Product edit response:', editResponse.data);

        if (editResponse.data?.status === 'success' || editResponse.data?.message || editResponse.status === 200) {
          toast.success('Product updated successfully!');
          await fetchProducts();
          closeProductModal();
        } else {
          toast.error(editResponse.data?.message || 'Failed to update product');
        }
      } else {
        // Add new product
        const formData = new FormData();
        formData.append('hsn_code', productForm.hsnCode);
        formData.append('product_name', productForm.productName);
        formData.append('product_description', productForm.productDescription);
        
        if (productForm.productImage) {
          formData.append('product_image', productForm.productImage);
        }

        const response = await api.post(`/product/add_product_by_admin/${uid || '7'}`, formData, {
          headers: getAuthHeaders()
        });

        console.log('Product add response:', response.data);

        if (response.data?.status === 'success' || response.data?.message || response.status === 200) {
          toast.success('Product added successfully!');
          await fetchProducts();
          closeProductModal();
        } else {
          toast.error(response.data?.message || 'Failed to add product');
        }
      }
    } catch (error) {
      console.error('Error saving product:', error);
      console.error('Error response:', error.response?.data);
      toast.error(`Failed to save product: ${error.response?.data?.message || error.message}`);
    } finally {
      setProductSaving(false);
    }
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return (
        <div className="flex flex-col">
          <span className="text-xs text-gray-400">▲</span>
          <span className="text-xs text-gray-400">▼</span>
        </div>
      );
    }
    
    return (
      <div className="flex flex-col">
        <span className={`text-xs ${sortDirection === 'asc' ? 'text-indigo-600' : 'text-gray-400'}`}>▲</span>
        <span className={`text-xs ${sortDirection === 'desc' ? 'text-indigo-600' : 'text-gray-400'}`}>▼</span>
      </div>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <FiRefreshCw className="animate-spin text-indigo-600 text-2xl" />
            <p className="text-indigo-700 dark:text-indigo-300">Loading products...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-orange-600">Products & Services</h1>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FiBriefcase className="text-indigo-600" />
            <span>Total Products: {products.length}</span>
          </div>
        </div>
        <div className="rounded-2xl shadow-lg bg-white dark:bg-gray-800 w-full">
          {/* Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by product name, company, HSN code, or description..."
                  className="pl-10 pr-4 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 transition-colors"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ minWidth: '100%', maxWidth: '100%' }}
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 flex-shrink-0">
                <span>Showing {Math.min((currentPage - 1) * entriesPerPage + 1, filteredProducts.length)} to {Math.min(currentPage * entriesPerPage, filteredProducts.length)} of {filteredProducts.length} entries</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 items-center justify-between xl:justify-start">
              <button 
                className="flex items-center gap-1 bg-green-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition"
                onClick={openProductModal}
                title="Add New Product"
              >
                <FiPlus /> 
                <span>Add Product</span>
              </button>
              <button 
                className="flex items-center gap-1 bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition"
                onClick={fetchProducts}
                title="Refresh Data"
              >
                <FiRefreshCw /> 
                <span>Refresh</span>
              </button>
            </div>
          </div>
          {/* Table - Desktop View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 text-gray-700 dark:text-gray-200 sticky top-0 z-10 shadow-sm">
                <tr className="border-b-2 border-indigo-200 dark:border-indigo-800">
          <th 
                    className="p-3 font-semibold border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-800/50 transition-colors" 
                    style={{ minWidth: '60px', width: '60px' }}
                    onClick={() => handleSort('id')}
                  >
                    Sr No. {renderSortIcon('id')}
                  </th>
          <th 
                    className="p-3 font-semibold border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-800/50 transition-colors" 
                    style={{ minWidth: '120px', width: '120px' }}
                    onClick={() => handleSort('image')}
                  >
                    Product Image {renderSortIcon('image')}
                  </th>
          <th 
                    className="p-3 font-semibold border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-800/50 transition-colors" 
                    style={{ minWidth: '120px', width: '120px' }}
                    onClick={() => handleSort('hsnCode')}
                  >
                    HSN Code {renderSortIcon('hsnCode')}
                  </th>
          <th 
                    className="p-3 font-semibold border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-800/50 transition-colors" 
                    style={{ minWidth: '150px', width: '150px' }}
                    onClick={() => handleSort('product')}
                  >
                    Product Name {renderSortIcon('product')}
                  </th>
          <th 
                    className="p-3 font-semibold border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-800/50 transition-colors" 
                    style={{ minWidth: '200px', width: '200px' }}
                    onClick={() => handleSort('description')}
                  >
                    Product Description {renderSortIcon('description')}
                  </th>
          <th
            className="p-3 font-semibold border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap"
            style={{ minWidth: '120px', width: '120px' }}
          >
            Action
          </th>
                </tr>
              </thead>
              <tbody>
                {getSortedProducts().slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage).map((product, idx) => (
                  <tr key={product.id} className={`border-b border-gray-200 dark:border-gray-700 transition-colors ${idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900/50'} hover:bg-indigo-50 dark:hover:bg-gray-700 hover:shadow-sm`}>
                    <td className="p-3 text-center font-semibold text-indigo-700 dark:text-indigo-300 border-r border-gray-200 dark:border-gray-700">{(currentPage - 1) * entriesPerPage + idx + 1}</td>
                    <td className="p-3 text-center border-r border-gray-200 dark:border-gray-700">
                      {product.image ? (
                        <img
                          src={`${import.meta.env.VITE_API_BASE_URL}/${product.image}`}
                          alt={product.product}
                          className="w-16 h-16 object-cover rounded-lg mx-auto"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mx-auto" style={{ display: product.image ? 'none' : 'flex' }}>
                        <FiImage className="text-gray-400" size={24} />
                      </div>
                    </td>
                    <td className="p-3 text-left border-r border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100">{product.hsnCode || 'N/A'}</td>
                    <td className="p-3 text-left border-r border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 font-medium">{product.product || 'N/A'}</td>
            <td className="p-3 text-left border-r border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100">
                      <div 
                        className="max-h-20 overflow-y-auto"
                        dangerouslySetInnerHTML={{ __html: product.description || 'N/A' }}
                      />
                    </td>
            <td className="p-3 text-center border-r border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => handleView(product)}
                  className="p-2 text-indigo-600 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-indigo-100 rounded-full hover:bg-indigo-100 dark:hover:bg-gray-700 transition-colors"
                  title="View"
                >
                  <FiEye size={16} />
                </button>
                <button
                  onClick={() => handleEdit(product)}
                  className="p-2 text-indigo-600 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-indigo-100 rounded-full hover:bg-indigo-100 dark:hover:bg-gray-700 transition-colors"
                  title="Edit"
                >
                  <FiEdit2 size={16} />
                </button>
              </div>
            </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile/Tablet Card View */}
          <div className="lg:hidden p-4 space-y-4">
            {getSortedProducts().slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage).map((product, idx) => (
              <div key={product.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {product.image ? (
                      <img
                        src={`${import.meta.env.VITE_API_BASE_URL}/${product.image}`}
                        alt={product.product}
                        className="w-16 h-16 object-cover rounded-lg"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center" style={{ display: product.image ? 'none' : 'flex' }}>
                      <FiImage className="text-gray-400" size={24} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-gray-600 dark:text-gray-400">Sr No.:</span><p className="font-semibold text-indigo-700 dark:text-indigo-300">{(currentPage - 1) * entriesPerPage + idx + 1}</p></div>
                      <div><span className="text-gray-600 dark:text-gray-400">HSN Code:</span><p className="font-medium text-gray-800 dark:text-gray-100">{product.hsnCode || 'N/A'}</p></div>
                      <div className="col-span-2"><span className="text-gray-600 dark:text-gray-400">Product Name:</span><p className="font-medium text-gray-800 dark:text-gray-100">{product.product || 'N/A'}</p></div>
                      <div className="col-span-2"><span className="text-gray-600 dark:text-gray-400">Description:</span><div className="mt-1 max-h-20 overflow-y-auto" dangerouslySetInnerHTML={{ __html: product.description || 'N/A' }} /></div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => handleView(product)}
                        className="p-2 text-indigo-600 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-indigo-100 rounded-full hover:bg-indigo-100 dark:hover:bg-gray-700 transition-colors"
                        title="View"
                      >
                        <FiEye size={16} />
                      </button>
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-2 text-indigo-600 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-indigo-100 rounded-full hover:bg-indigo-100 dark:hover:bg-gray-700 transition-colors"
                        title="Edit"
                      >
                        <FiEdit2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Pagination Controls */}
          <div className="flex flex-row items-center justify-between gap-4 p-6 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Show</span>
              <select
                className="border rounded-lg px-3 py-1 text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 text-gray-700 focus:ring-2 focus:ring-indigo-400 transition-colors"
                value={entriesPerPage}
                onChange={e => { setEntriesPerPage(Number(e.target.value)); setCurrentPage(1); }}
              >
                {[5, 10, 25, 50, 100].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
              <span className="text-sm text-gray-600 dark:text-gray-400">entries per page</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-gray-700 transition-colors ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Previous"
              >
                <FiChevronLeft size={16} />
              </button>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Page {currentPage} of {Math.ceil(filteredProducts.length / entriesPerPage)}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredProducts.length / entriesPerPage), p + 1))}
                disabled={currentPage === Math.ceil(filteredProducts.length / entriesPerPage)}
                className={`p-2 rounded-lg text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-gray-700 transition-colors ${currentPage === Math.ceil(filteredProducts.length / entriesPerPage) ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Next"
              >
                <FiChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              onClick={closeProductModal}
            >
              <FiX size={24} />
            </button>
            <h2 className="text-xl font-bold mb-6 text-gray-800">{isEditing ? 'Edit Product' : 'Add Product'}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* HSN/SAC Code */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  * HSN/SAC Code
                </label>
                <input
                  type="text"
                  placeholder="Enter HSN Code"
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                  value={productForm.hsnCode}
                  onChange={(e) => handleProductFormChange('hsnCode', e.target.value)}
                />
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  * Product Name
                </label>
                <input
                  type="text"
                  placeholder="Enter Product Name"
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                  value={productForm.productName}
                  onChange={(e) => handleProductFormChange('productName', e.target.value)}
                />
              </div>
            </div>

            {/* Product Image */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">
                Product Image
              </label>
              <input
                type="file"
                accept="image/*"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                onChange={(e) => handleProductFormChange('productImage', e.target.files[0])}
              />
            </div>

            {/* Product Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">
                Product Description
              </label>
              <RichTextEditor
                data={productForm.productDescription}
                onChange={(data) => handleProductFormChange('productDescription', data)}
                placeholder="Enter product description..."
                height="300px"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <button
                className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                onClick={closeProductModal}
              >
                Close
              </button>
              <button
                className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleProductSave}
                disabled={productSaving || !productForm.hsnCode || !productForm.productName}
              >
                {productSaving ? (
                  <>
                    <FiRefreshCw className="animate-spin" size={16} />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{isEditing ? 'Update Product' : 'Save Product'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showViewModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Product Details</h3>
              <button
                onClick={() => { setShowViewModal(false); setSelectedProduct(null); }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">Product Information</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">HSN/SAC Code:</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100 break-words max-w-xs text-right">{selectedProduct.hsnCode || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Product Name:</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100 break-words max-w-xs text-right">{selectedProduct.product || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Company:</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100 break-words max-w-xs text-right">{selectedProduct.company || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Date:</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {selectedProduct.dtime ? new Date(selectedProduct.dtime).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">Attachment</h4>
                  {selectedProduct.image ? (
                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                      <img
                        src={`${import.meta.env.VITE_API_BASE_URL}/${selectedProduct.image}`}
                        alt="Product Image"
                        className="w-full h-auto max-h-96 object-contain bg-gray-50 dark:bg-gray-700"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="items-center justify-center h-48 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400" style={{ display: 'none' }}>
                        <div className="text-center">
                          <FiFile className="mx-auto text-4xl mb-2" />
                          <p>Image not available</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-48 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="text-center text-gray-500 dark:text-gray-400">
                        <FiFile className="mx-auto text-4xl mb-2" />
                        <p>No attachment available</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">Description</h4>
                <div className="text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg max-h-60 overflow-y-auto">
                  {(() => {
                    const description = selectedProduct.description || 'No description available';
                    return description
                      .replace(/<[^>]*>/g, '')
                      .replace(/\n/g, '<br />')
                      .split('<br />')
                      .map((line, index) => (
                        <p key={index} className="mb-2 last:mb-0">{line.trim() || '\u00A0'}</p>
                      ));
                  })()}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => { setShowViewModal(false); setSelectedProduct(null); }}
                  className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
