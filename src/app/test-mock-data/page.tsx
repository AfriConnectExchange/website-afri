"use client";
import React, { useState, useEffect } from 'react';

export default function MockDataTestPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => {
    (async () => {
      try {
        const catsRes = await fetch('/api/categories')
        const catsJson = await catsRes.json()
        setCategories(catsJson || [])

        const productsRes = await fetch('/api/categories/all/products')
        const productsJson = await productsRes.json()
        setProducts(productsJson || [])
      } catch (err) {
        console.error('Mock data test load error', err)
      }
    })()
  }, [])

  const filteredProducts = products.filter((product: any) => {
    const matchesCategory = selectedCategory === 'all' || (product.category || '').toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      (product.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (product.description || '').toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Mock Data Test Page</h1>
      <div className="mb-4 flex gap-4">
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="border px-2 py-1 rounded"
        >
          {categories.map((cat: any) => (
            <option key={cat.id} value={cat.name.toLowerCase()}>{cat.name}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border px-2 py-1 rounded"
        />
      </div>
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product: any) => (
          <li key={product.id} className="border rounded p-4 shadow">
            <img src={product.images?.[0]} alt={product.title} className="w-full h-40 object-cover mb-2 rounded" />
            <h2 className="font-semibold text-lg">{product.title}</h2>
            <p className="text-sm text-gray-600 mb-2">{product.description}</p>
            <div className="flex justify-between items-center">
              <span className="font-bold">£{product.price}</span>
              <span className="text-xs bg-green-100 px-2 py-1 rounded">{product.category}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
