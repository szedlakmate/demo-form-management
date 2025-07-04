"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface Field {
  id: string;
  name: string;
  type: string;
}

interface Section {
  id: string;
  title: string;
  fields: Field[];
}

export default function FormCraftingPage() {
  const [title, setTitle] = useState("");
  const [sections, setSections] = useState<Section[]>([]);
  const router = useRouter();

  function addSection() {
    setSections([
      ...sections,
      { id: crypto.randomUUID(), title: "", fields: [] },
    ]);
  }

  function updateSectionTitle(sectionId: string, newTitle: string) {
    setSections(
      sections.map((s) => (s.id === sectionId ? { ...s, title: newTitle } : s)),
    );
  }

  function addField(sectionId: string) {
    setSections(
      sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              fields: [
                ...s.fields,
                { id: crypto.randomUUID(), name: "", type: "text" },
              ],
            }
          : s,
      ),
    );
  }

  function updateField(
    sectionId: string,
    fieldId: string,
    key: keyof Field,
    value: string,
  ) {
    setSections(
      sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              fields: s.fields.map((f) =>
                f.id === fieldId ? { ...f, [key]: value } : f,
              ),
            }
          : s,
      ),
    );
  }

  function removeField(sectionId: string, fieldId: string) {
    setSections(
      sections.map((s) =>
        s.id === sectionId
          ? { ...s, fields: s.fields.filter((f) => f.id !== fieldId) }
          : s,
      ),
    );
  }

  function removeSection(sectionId: string) {
    setSections(sections.filter((s) => s.id !== sectionId));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("admin-token")
        : null;
    if (!token) {
      alert("Not authenticated");
      return;
    }
    // Prepare payload for backend
    const payload = {
      title,
      sections: sections.map((section, idx) => ({
        title: section.title,
        order: idx + 1,
        fields: section.fields.map((field, fidx) => ({
          label: field.name,
          type: field.type.toUpperCase(),
          required: true,
          order: fidx + 1,
          default: "",
        })),
      })),
    };
    const res = await fetch("/api/admin/forms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      router.push("/admin/forms");
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Failed to create form");
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Form</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block font-semibold mb-1">Form Title</label>
          <input
            className="input input-bordered w-full"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold">Sections</span>
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={addSection}
            >
              Add Section
            </button>
          </div>
          {sections.length === 0 && (
            <div className="text-gray-400">No sections yet.</div>
          )}
          {sections.map((section) => (
            <div
              key={section.id}
              className="mb-4 p-4 bg-base-200 rounded shadow"
            >
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-medium mb-1">
                  Section Title
                </label>
                <button
                  type="button"
                  className="btn btn-xs btn-error ml-2"
                  title="Remove section"
                  onClick={() => removeSection(section.id)}
                >
                  X
                </button>
              </div>
              <input
                className="input input-bordered w-full"
                value={section.title}
                onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                required
              />
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-semibold">Fields</span>
                  <button
                    type="button"
                    className="btn btn-xs btn-secondary"
                    onClick={() => addField(section.id)}
                  >
                    Add Field
                  </button>
                </div>
                {section.fields.length === 0 && (
                  <div className="text-gray-400 text-xs">No fields yet.</div>
                )}
                {section.fields.map((field) => (
                  <div key={field.id} className="flex gap-2 mb-2 items-center">
                    <input
                      className="input input-bordered input-sm flex-1"
                      placeholder="Field Name"
                      value={field.name}
                      onChange={(e) =>
                        updateField(
                          section.id,
                          field.id,
                          "name",
                          e.target.value,
                        )
                      }
                      required
                    />
                    <select
                      className="select select-bordered select-sm"
                      value={field.type}
                      onChange={(e) =>
                        updateField(
                          section.id,
                          field.id,
                          "type",
                          e.target.value,
                        )
                      }
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                    </select>
                    <button
                      type="button"
                      className="btn btn-xs btn-error"
                      title="Remove field"
                      onClick={() => removeField(section.id, field.id)}
                    >
                      X
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button className="btn btn-primary" type="submit">
          Create Form
        </button>
      </form>
    </div>
  );
}
