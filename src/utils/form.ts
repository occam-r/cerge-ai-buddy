import { ImageFileType } from "../state/visual/VisualContext"
import { getSectionData, getSectionImages } from "./api"

export const formatFieldArrayValues = (values: string[]) => {
    return values.map((value) => {
        return {
            [`value`]: value,
        }
    })
}

// Define the type for the response of fetchSectionImagesAndData
type SectionData = {
    images: ImageFileType[]
    formData: { [key: string]: any } // Adjust based on the exact structure of formData
}

export const fetchSectionImagesAndData = async (
    venueId: string | undefined,
    sectionName: string | undefined,
    sectionId: string | number | undefined
): Promise<SectionData> => {
    if (!venueId || !sectionName) return { images: [], formData: {} }
    const sectionData = await getSectionData(venueId ?? "", sectionName ?? "")

    const parsedFormData = JSON.parse(sectionData)

    const formData = { ...parsedFormData?.areas[0], sectionId: sectionId }

    const images = await getSectionImages(
        venueId ?? "",
        formData?.sectionName ?? ""
    )

    // Transform backend images to match the ImageFileType structure
    const transformedImages: ImageFileType[] = images.map((image: any) => ({
        name: image.name,
        type: image.type,
        lastModified: image.lastModified,
        size: image.size,
        id: image.id,
        path: image.path,
        uri: `data:${image.type};base64,${image.blob}`, // Convert base64 to data URI for rendering
    }))

    return {
        images: transformedImages,
        formData,
    }
}

export const containsSpecialCharacters = (value: string) => {
    const regex = /[^a-zA-Z0-9 .]/g // Matches any character that's not a letter, number, space, or dot
    return regex.test(value)
}
