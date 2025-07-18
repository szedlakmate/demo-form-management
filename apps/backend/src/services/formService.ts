import { Form, Prisma, PrismaClient } from "@prisma/client";
import { createSection } from "./sectionService";

const prisma = new PrismaClient();

export type CreateFormWithSectionsInput = {
  title: string;
  sections: Array<{
    title: string;
    order: number;
    fields?: Array<{
      label: string;
      type: "TEXT" | "NUMBER";
      required: boolean;
      order: number;
      default?: string;
    }>;
  }>;
};

export type FormWithSections = Prisma.FormGetPayload<{
  include: {
    sections: {
      include: {
        fields: true;
      };
    };
  };
}>;

export async function createForm(
  data: CreateFormWithSectionsInput,
): Promise<FormWithSections> {
  // Validation: must have at least one section
  if (!data.sections || data.sections.length === 0) {
    throw new Error("A form must have at least one section.");
  }
  try {
    return await prisma.$transaction(async (tx) => {
      const form = await tx.form.create({
        data: {
          title: data.title,
        },
      });
      for (const sectionData of data.sections) {
        await createSection(
          {
            title: sectionData.title,
            order: sectionData.order,
            form: { connect: { id: form.id } },
          },
          sectionData.fields?.map(
            ({ label, type, required, order, default: def }) => ({
              label,
              type,
              required,
              order,
              default: def,
            }),
          ) || [],
          tx,
        );
      }
      return tx.form.findUniqueOrThrow({
        where: { id: form.id },
        include: {
          sections: {
            include: { fields: true },
          },
        },
      });
    });
  } catch (err) {
    console.error("Error in createForm:", err);
    throw err;
  }
}

export async function getFormById(id: string): Promise<FormWithSections> {
  return prisma.form.findUniqueOrThrow({
    where: { id },
    include: {
      sections: {
        include: {
          fields: true,
        },
      },
    },
  });
}

export async function getFormByToken(token: string): Promise<FormWithSections> {
  return prisma.form.findUniqueOrThrow({
    where: { token },
    include: {
      sections: {
        include: {
          fields: true,
        },
      },
    },
  });
}

export async function deleteForm(id: string): Promise<Form> {
  return prisma.form.delete({ where: { id } });
}

export async function deleteFormByToken(token: string): Promise<Form> {
  return prisma.$transaction(async (tx) => {
    const form = await tx.form.findUniqueOrThrow({
      where: { token },
      include: {
        sections: {
          include: {
            fields: {
              include: { responses: true },
            },
          },
        },
      },
    });
    // Check for any responses on any field
    const hasResponses = form.sections.some((section) =>
      section.fields.some(
        (field) => field.responses && field.responses.length > 0,
      ),
    );
    if (hasResponses) {
      throw new Error("Cannot delete form: it has submitted responses.");
    }
    // Delete the form (cascades to sections/fields)
    return tx.form.delete({ where: { token } });
  });
}

export async function listForms(): Promise<FormWithSections[]> {
  return prisma.form.findMany({
    include: {
      sections: {
        include: {
          fields: true,
        },
      },
    },
  });
}
