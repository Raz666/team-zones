export type HomeUiModal = 'add' | 'edit' | 'privacy' | 'language' | null;

export type HomeUiState = {
  activeModal: HomeUiModal;
  editIndex: number | null;
  deleteIndex: number | null;
  menuOpen: boolean;
};

export type HomeUiAction =
  | { type: 'OPEN_ADD' }
  | { type: 'OPEN_EDIT'; index: number }
  | { type: 'OPEN_PRIVACY' }
  | { type: 'OPEN_LANGUAGE' }
  | { type: 'CLOSE_MODAL' }
  | { type: 'SET_EDIT_INDEX'; index: number | null }
  | { type: 'REQUEST_DELETE'; index: number }
  | { type: 'CLEAR_DELETE' }
  | { type: 'TOGGLE_MENU' }
  | { type: 'SET_MENU'; open: boolean };

export const homeUiInitialState: HomeUiState = {
  activeModal: null,
  editIndex: null,
  deleteIndex: null,
  menuOpen: false,
};

export function homeUiReducer(state: HomeUiState, action: HomeUiAction): HomeUiState {
  switch (action.type) {
    case 'OPEN_ADD':
      return { ...state, activeModal: 'add', editIndex: null, menuOpen: false };
    case 'OPEN_EDIT':
      return { ...state, activeModal: 'edit', editIndex: action.index, menuOpen: false };
    case 'OPEN_PRIVACY':
      return { ...state, activeModal: 'privacy', menuOpen: false };
    case 'OPEN_LANGUAGE':
      return { ...state, activeModal: 'language', menuOpen: false };
    case 'CLOSE_MODAL':
      return { ...state, activeModal: null };
    case 'SET_EDIT_INDEX':
      return { ...state, editIndex: action.index };
    case 'REQUEST_DELETE':
      return { ...state, deleteIndex: action.index };
    case 'CLEAR_DELETE':
      return { ...state, deleteIndex: null };
    case 'TOGGLE_MENU':
      return { ...state, menuOpen: !state.menuOpen };
    case 'SET_MENU':
      return { ...state, menuOpen: action.open };
    default:
      return state;
  }
}
