import { Area, SensoryType } from "@lib/sectionDataType";
import { SectionImage, Status } from "@lib/sectionImageType";
import { Section } from "@lib/sectionType";
import { Venue } from "@lib/venueType";

type State = {
  venue: Venue | null;
  section: Section | null;
  venues: Venue[];
  sections: Section[];
  sectionImages: SectionImage[];
  sectionData: Area[];
  prompt: string;
  loading: {
    venues: boolean;
    sections: boolean;
    images: boolean;
    uploadImage: boolean;
    saveImage: boolean;
    data: boolean;
    prompt: boolean;
    content: boolean;
  };
};

type Action =
  | { type: "SET_VENUES"; payload: Venue[] }
  | { type: "SET_SECTIONS"; payload: Section[] }
  | { type: "SET_SECTION_IMAGES"; payload: SectionImage[] }
  | { type: "SET_SECTION_DATA"; payload: Area[] }
  | { type: "SET_SELECTED_VENUE"; payload: Venue | null }
  | { type: "SET_SELECTED_SECTION"; payload: Section | null }
  | { type: "SET_LOADING"; payload: Partial<State["loading"]> }
  | {
      type: "DELETE_ITEM";
      payload: { sensoryType: SensoryType; index: number };
    }
  | { type: "ADD_ITEM"; payload: SensoryType }
  | {
      type: "UPDATE_ITEM";
      payload: { sensoryType: SensoryType; value: string; index: number };
    }
  | {
      type: "UPDATE_SECTION_DATA";
      payload: {
        [K in keyof Area]: { key: K; value: Area[K] };
      }[keyof Area];
    }
  | { type: "SET_PROMPT"; payload: string }
  | { type: "DELETE_IMAGE"; payload: number }
  | { type: "UPDATE_IMAGE_STATUS"; payload: { index: number; status: Status } };

export const initialHomeState: State = {
  venue: null,
  section: null,
  venues: [],
  sections: [],
  sectionImages: [],
  sectionData: [],
  prompt: "",
  loading: {
    venues: false,
    sections: false,
    images: false,
    uploadImage: false,
    saveImage: false,
    data: false,
    prompt: false,
    content: false,
  },
};

export const homeReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "SET_VENUES":
      return { ...state, venues: action.payload };
    case "SET_SECTIONS":
      return { ...state, sections: action.payload };
    case "SET_SECTION_IMAGES":
      return { ...state, sectionImages: action.payload };
    case "SET_SECTION_DATA":
      return { ...state, sectionData: action.payload };
    case "SET_SELECTED_VENUE":
      return { ...state, venue: action.payload };
    case "SET_SELECTED_SECTION":
      return { ...state, section: action.payload };
    case "SET_LOADING":
      return { ...state, loading: { ...state.loading, ...action.payload } };
    case "DELETE_ITEM":
      return {
        ...state,
        sectionData: state.sectionData.map((area) => ({
          ...area,
          [action.payload.sensoryType]: area[action.payload.sensoryType].filter(
            (_, i) => i !== action.payload.index,
          ),
        })),
      };

    case "ADD_ITEM":
      return {
        ...state,
        sectionData: state.sectionData.map((area) => ({
          ...area,
          [action.payload]: [...area[action.payload], { value: "" }],
        })),
      };
    case "UPDATE_ITEM":
      return {
        ...state,
        sectionData: state.sectionData.map((area) => ({
          ...area,
          [action.payload.sensoryType]: area[action.payload.sensoryType].map(
            (item, i) =>
              i === action.payload.index
                ? { ...item, value: action.payload.value }
                : item,
          ),
        })),
      };
    case "UPDATE_SECTION_DATA":
      const key = action.payload?.key ?? "description";
      return {
        ...state,
        sectionData: [
          {
            ...state.sectionData[0],
            [key]: action.payload?.value,
          },
        ],
      };
    case "SET_PROMPT":
      return { ...state, prompt: action.payload };
    case "DELETE_IMAGE": {
      const deletedIndex = action.payload;
      const newSectionImages = state.sectionImages.filter(
        (_, idx) => idx !== deletedIndex,
      );

      return {
        ...state,
        sectionImages: newSectionImages,
        sectionData: state.sectionData.map((area, areaIndex) => {
          if (areaIndex === 0) {
            const newShadowCorrections = area.shadowCorrections?.filter(
              (_, idx) => idx !== deletedIndex,
            );
            const newHeroImages = area.heroImages?.filter(
              (_, idx) => idx !== deletedIndex,
            );
            return {
              ...area,
              shadowCorrections: newShadowCorrections,
              heroImages: newHeroImages,
            };
          }
          return area;
        }),
      };
    }
    case "UPDATE_IMAGE_STATUS": {
      const { index, status } = action.payload;
      const updatedImages = state.sectionImages.map((img, idx) =>
        idx === index ? { ...img, status } : img,
      );
      return { ...state, sectionImages: updatedImages };
    }

    default:
      return state;
  }
};
