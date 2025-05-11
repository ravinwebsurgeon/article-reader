"use client";
import type React from "react";
import { Modal } from "react-native";
import type Item from "@/database/models/ItemModel";
import EditTagsScreen from "@/components/features/tag/EditTag";

interface EditTagsModalProps {
  visible: boolean;
  onClose: () => void;
  item: Item;
}

const EditTagsModal: React.FC<EditTagsModalProps> = ({ visible, onClose, item }) => {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <EditTagsScreen item={item} onClose={onClose} visible={visible} />
    </Modal>
  );
};

export default EditTagsModal;
