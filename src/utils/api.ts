/* eslint-disable @typescript-eslint/no-explicit-any */
import { Content, ContentReq, ContentRes } from "../lib/contentType";
import { PromptDataRes } from "../lib/promptType";
import {
  Area,
  SectionData,
  SectionDataReq,
  SectionDataRes,
} from "../lib/sectionDataType";
import {
  SectionImage,
  SectionImageReq,
  SectionImageRes,
} from "../lib/sectionImageType";
import { Section, SectionReq, SectionRes } from "../lib/sectionType";
import { Venue, VenuesRes } from "../lib/venueType";
import axios from "./axios";
import { compressImage } from "./imageProcess";
import url from "./url";

export const getVenues = async (): Promise<Venue[]> => {
  try {
    const { data } = await axios.get<VenuesRes>(url.venues);

    if (data?.message !== "success" || !Array.isArray(data.venues)) {
      throw new Error("Invalid Venues response format");
    }

    return data.venues;
  } catch (error) {
    console.error(
      "Error fetching Venues:",
      error instanceof Error ? error.message : error
    );
    return [];
  }
};

export const getSection = async (
  params: SectionReq,
  signal: AbortSignal | undefined
): Promise<Section[]> => {
  try {
    const { data } = await axios.get<SectionRes>(url.sectionList, {
      params,
      signal,
    });

    if (data?.message !== "success" || !Array.isArray(data.sectionList)) {
      throw new Error("Invalid Section response format");
    }

    return data.sectionList;
  } catch (error) {
    console.error(
      "Error fetching Section:",
      error instanceof Error ? error.message : error
    );
    return [];
  }
};

export const getSectionImages = async (
  params: SectionImageReq,
  signal: AbortSignal | undefined
): Promise<SectionImage[]> => {
  try {
    const { data } = await axios.get<SectionImageRes>(url.sectionImages, {
      params,
      signal,
    });
    if (data?.message !== "success" || !Array.isArray(data.images)) {
      throw new Error("Invalid Section Image response format");
    }

    return data.images;
  } catch (error) {
    console.error(
      "Error fetching Section Image:",
      error instanceof Error ? error.message : error
    );
    return [];
  }
};

export const getSectionData = async (
  params: SectionDataReq,
  signal: AbortSignal | undefined
): Promise<SectionData["areas"]> => {
  try {
    const { data } = await axios.get<SectionDataRes>(url.sectionData, {
      params,
      signal,
    });
    if (data?.message !== "success" || !data.formData) {
      throw new Error("Invalid Section Data response format");
    }

    const parsedFormData = JSON.parse(data.formData) as SectionData;

    return parsedFormData.areas;
  } catch (error) {
    console.error(
      "Error fetching Section Data:",
      error instanceof Error ? error.message : error
    );
    return [];
  }
};

export const getPrompts = async (
  signal: AbortSignal | undefined
): Promise<string> => {
  try {
    const { data } = await axios.get<PromptDataRes>(url.prompt, { signal });

    if (data?.message !== "success" && !data?.prompt) {
      throw new Error("Invalid Prompts response format");
    }

    return data.prompt;
  } catch (error) {
    console.error(
      "Error fetching Prompts:",
      error instanceof Error ? error.message : error
    );
    return "";
  }
};

export const generateContent = async ({
  params,
  signal,
}: {
  params: ContentReq;
  signal: AbortSignal | undefined;
}): Promise<Area> => {
  try {
    const CONCURRENCY_LIMIT = 4;
    const queue: Promise<SectionImage>[] = [];
    const activePromises: Set<Promise<any>> = new Set();

    for (const file of params.files) {
      const originalUri = `data:${file.type};base64,${file.blob}`;

      const promise = compressImage(originalUri)
        .then((compressedBase64) => ({
          ...file,
          blob: compressedBase64,
        }))
        .finally(() => activePromises.delete(promise));

      activePromises.add(promise);
      queue.push(promise);

      if (activePromises.size >= CONCURRENCY_LIMIT) {
        await Promise.race(activePromises);
      }
    }

    const compressedFiles = await Promise.all(queue);

    const formData = new FormData();

    compressedFiles.forEach((file) => {
      const fileData = {
        uri: `data:${file.type};base64,${file.blob}`,
        name: file.name.replace(/\.[^/.]+$/, ".jpg"),
        type: file.type,
      };

      formData.append("files", fileData as any);
    });

    formData.append("userPrompt", params.userPrompt);

    const { data } = await axios.post<ContentRes>(url.generateVisual, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      signal: signal,
    });

    const content = JSON.parse(data.description) as Content;

    return {
      description: content.description,
      feels: content.feels.map((item) => ({ value: item })),
      sights: content.sights.map((item) => ({ value: item })),
      smells: content.smells.map((item) => ({ value: item })),
      sounds: content.sounds.map((item) => ({ value: item })),
    };
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
};
