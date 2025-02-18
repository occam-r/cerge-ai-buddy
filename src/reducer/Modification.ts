import { OrderChangeParams } from "react-native-sortables";
import { SectionImage } from "../lib/sectionImageType";

export type shadowHeroType = Record<string, boolean>;

type State = {
  sectionImages: SectionImage[];
  shadowCorrections: shadowHeroType;
  heroImages: shadowHeroType;
  orderChanged: OrderChangeParams | undefined;
  loading: {
    images: boolean;
  };
};

type Action =
  | {
      type: "SET_MODAL_DATA";
      payload: {
        sectionImages: SectionImage[];
        shadowCorrections: shadowHeroType;
        heroImages: shadowHeroType;
      };
    }
  | { type: "TOGGLE_SHADOW_CORRECTION"; payload: string }
  | { type: "TOGGLE_HERO_IMAGE"; payload: string }
  | { type: "DELETE_IMAGE"; payload: string }
  | { type: "UPDATE_ORDER"; payload: OrderChangeParams }
  | { type: "SET_LOADING"; payload: Partial<State["loading"]> };

export const modificationInitialState: State = {
  sectionImages: [],
  shadowCorrections: {},
  heroImages: {},
  orderChanged: undefined,
  loading: {
    images: false,
  },
};

export const modificationReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "SET_MODAL_DATA": {
      const { sectionImages, shadowCorrections, heroImages } = action.payload;
      return {
        ...state,
        sectionImages,
        shadowCorrections,
        heroImages,
      };
    }

    case "TOGGLE_SHADOW_CORRECTION": {
      const key = action.payload;
      return {
        ...state,
        shadowCorrections: {
          ...state.shadowCorrections,
          [key]: !state.shadowCorrections[key],
        },
      };
    }

    case "TOGGLE_HERO_IMAGE": {
      const key = action.payload;
      const updatedHeroImages = Object.keys(state.heroImages).reduce(
        (acc, curr) => {
          acc[curr] = false;
          return acc;
        },
        {} as shadowHeroType
      );
      updatedHeroImages[key] = !state.heroImages[key];

      return {
        ...state,
        heroImages: updatedHeroImages,
      };
    }

    case "DELETE_IMAGE": {
      const key = action.payload;
      const { [key]: deletedShadow, ...remainingShadows } =
        state.shadowCorrections;
      const { [key]: deletedHero, ...remainingHeroes } = state.heroImages;

      return {
        ...state,
        sectionImages: state.sectionImages.filter(
          (item) => item.id !== action.payload
        ),
        shadowCorrections: remainingShadows,
        heroImages: remainingHeroes,
      };
    }

    case "UPDATE_ORDER":
      return {
        ...state,
        orderChanged: action.payload,
      };

    case "SET_LOADING":
      return { ...state, loading: { ...state.loading, ...action.payload } };

    default:
      return state;
  }
};
