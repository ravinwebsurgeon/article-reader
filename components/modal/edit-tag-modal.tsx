"use client";

import type React from "react";
import { Modal } from "react-native";
import type Item from "@/database/models/ItemModel";
import EditTagsScreen from "@/screens/EditTag";

interface EditTagsModalProps {
  visible: boolean;
  onClose: () => void;
  item: Item;
}

const EditTagsModal: React.FC<EditTagsModalProps> = ({ visible, onClose, item }) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <EditTagsScreen item={item} onClose={onClose} />
    </Modal>
  );
};

export default EditTagsModal;
