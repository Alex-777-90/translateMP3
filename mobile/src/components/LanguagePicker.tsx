import React, {
  useMemo,
  useState,
} from "react";

import {
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";


// ============================================================
// TIPOS
// ============================================================

export interface LanguageOption {
  code: string;
  name: string;
  voice_name?: string;
}


interface LanguagePickerProps {

  languages: LanguageOption[];

  value: string;

  onChange: (
    languageCode: string
  ) => void;

  includeAuto?: boolean;

  disabled?: boolean;

  placeholder?: string;

}


// ============================================================
// COMPONENTE
// ============================================================

export default function LanguagePicker({

  languages,

  value,

  onChange,

  includeAuto = false,

  disabled = false,

  placeholder = "Selecione um idioma",

}: LanguagePickerProps) {


  // ==========================================================
  // ESTADOS
  // ==========================================================

  const [modalVisible, setModalVisible] =
    useState(false);

  const [search, setSearch] =
    useState("");


  // ==========================================================
  // IDIOMA SELECIONADO
  // ==========================================================

  const selectedLanguage =
    useMemo(() => {

      if (
        includeAuto &&
        value === "auto"
      ) {

        return {
          code: "auto",
          name: "Detectar automaticamente",
        };

      }


      return languages.find(
        (language) =>
          language.code.toLowerCase() ===
          value.toLowerCase()
      );

    }, [
      includeAuto,
      languages,
      value,
    ]);


  // ==========================================================
  // LISTA COM AUTO
  // ==========================================================

  const completeLanguages =
    useMemo(() => {

      const list: LanguageOption[] = [
        ...languages,
      ];


      if (includeAuto) {

        return [
          {
            code: "auto",
            name: "Detectar automaticamente",
            voice_name:
              "Detecção automática",
          },

          ...list,
        ];

      }


      return list;

    }, [
      languages,
      includeAuto,
    ]);


  // ==========================================================
  // FILTRO
  // ==========================================================

  const filteredLanguages =
    useMemo(() => {

      const term =
        normalizeText(
          search.trim()
        );


      if (!term) {

        return completeLanguages;

      }


      return completeLanguages.filter(
        (language) => {

          const name =
            normalizeText(
              language.name
            );


          const code =
            normalizeText(
              language.code
            );


          const voiceName =
            normalizeText(
              language.voice_name || ""
            );


          return (
            name.includes(term) ||
            code.includes(term) ||
            voiceName.includes(term)
          );

        }
      );

    }, [
      completeLanguages,
      search,
    ]);


  // ==========================================================
  // ABRIR
  // ==========================================================

  function handleOpen() {

    if (disabled) {
      return;
    }


    setSearch("");

    setModalVisible(true);

  }


  // ==========================================================
  // FECHAR
  // ==========================================================

  function handleClose() {

    setModalVisible(false);

    setSearch("");

  }


  // ==========================================================
  // SELECIONAR
  // ==========================================================

  function handleSelect(
    language: LanguageOption
  ) {

    onChange(
      language.code
    );


    handleClose();

  }


  // ==========================================================
  // RENDERIZAR ITEM
  // ==========================================================

  function renderLanguage({
    item,
  }: {
    item: LanguageOption;
  }) {

    const selected =
      item.code.toLowerCase() ===
      value.toLowerCase();


    return (

      <TouchableOpacity
        style={[
          styles.languageItem,

          selected &&
          styles.languageItemSelected,
        ]}
        onPress={() =>
          handleSelect(item)
        }
        activeOpacity={0.7}
      >

        <View
          style={
            styles.languageInfo
          }
        >

          <Text
            style={[
              styles.languageName,

              selected &&
              styles.languageNameSelected,
            ]}
          >

            {item.name}

          </Text>


          {item.code !== "auto" && (

            <Text
              style={
                styles.languageCode
              }
            >

              {item.code}

            </Text>

          )}

        </View>


        {selected && (

          <View
            style={
              styles.selectedCircle
            }
          >

            <Text
              style={
                styles.selectedIcon
              }
            >
              ✓
            </Text>

          </View>

        )}

      </TouchableOpacity>

    );

  }


  // ==========================================================
  // INTERFACE
  // ==========================================================

  return (

    <View>

      {/* ================================================= */}
      {/* BOTÃO DO SELECTOR                                */}
      {/* ================================================= */}

      <TouchableOpacity
        style={[
          styles.selector,

          disabled &&
          styles.selectorDisabled,
        ]}
        onPress={handleOpen}
        disabled={disabled}
        activeOpacity={0.75}
      >

        <View
          style={
            styles.selectorTextContainer
          }
        >

          <Text
            style={[
              styles.selectorText,

              !selectedLanguage &&
              styles.placeholderText,
            ]}
            numberOfLines={1}
          >

            {
              selectedLanguage
                ? selectedLanguage.name
                : placeholder
            }

          </Text>


          {selectedLanguage &&
            selectedLanguage.code !==
              "auto" && (

              <Text
                style={
                  styles.selectorCode
                }
              >

                {
                  selectedLanguage.code
                }

              </Text>

          )}

        </View>


        <Text style={styles.arrow}>
          ▼
        </Text>

      </TouchableOpacity>


      {/* ================================================= */}
      {/* MODAL                                            */}
      {/* ================================================= */}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={
          handleClose
        }
      >

        <View
          style={
            styles.modalOverlay
          }
        >

          {/* Fecha ao tocar fora */}

          <Pressable
            style={
              styles.overlayPressArea
            }
            onPress={
              handleClose
            }
          />


          <SafeAreaView
            style={
              styles.modalContainer
            }
          >

            {/* =========================================== */}
            {/* CABEÇALHO                                  */}
            {/* =========================================== */}

            <View
              style={
                styles.modalHeader
              }
            >

              <View>

                <Text
                  style={
                    styles.modalTitle
                  }
                >
                  Selecione o idioma
                </Text>

                <Text
                  style={
                    styles.modalSubtitle
                  }
                >
                  {
                    filteredLanguages.length
                  }{" "}
                  opções disponíveis
                </Text>

              </View>


              <TouchableOpacity
                style={
                  styles.closeButton
                }
                onPress={
                  handleClose
                }
                activeOpacity={0.7}
              >

                <Text
                  style={
                    styles.closeButtonText
                  }
                >
                  ✕
                </Text>

              </TouchableOpacity>

            </View>


            {/* =========================================== */}
            {/* PESQUISA                                   */}
            {/* =========================================== */}

            <View
              style={
                styles.searchContainer
              }
            >

              <Text
                style={
                  styles.searchIcon
                }
              >
                🔎
              </Text>


              <TextInput
                style={
                  styles.searchInput
                }
                value={search}
                onChangeText={
                  setSearch
                }
                placeholder="Pesquisar idioma..."
                placeholderTextColor="#94a3b8"
                autoCorrect={false}
                autoCapitalize="none"
                clearButtonMode="while-editing"
              />

            </View>


            {/* =========================================== */}
            {/* LISTA                                      */}
            {/* =========================================== */}

            <FlatList
              data={
                filteredLanguages
              }

              renderItem={
                renderLanguage
              }

              keyExtractor={(
                item
              ) =>
                item.code
              }

              keyboardShouldPersistTaps="handled"

              showsVerticalScrollIndicator={
                false
              }

              contentContainerStyle={
                filteredLanguages.length ===
                0
                  ? styles.emptyList
                  : styles.listContent
              }

              ListEmptyComponent={

                <View
                  style={
                    styles.emptyContainer
                  }
                >

                  <Text
                    style={
                      styles.emptyIcon
                    }
                  >
                    🌐
                  </Text>

                  <Text
                    style={
                      styles.emptyTitle
                    }
                  >
                    Idioma não encontrado
                  </Text>

                  <Text
                    style={
                      styles.emptyDescription
                    }
                  >
                    Tente pesquisar pelo nome
                    ou código do idioma.
                  </Text>

                </View>

              }
            />

          </SafeAreaView>

        </View>

      </Modal>

    </View>

  );

}


// ============================================================
// NORMALIZAÇÃO PARA PESQUISA
// ============================================================

function normalizeText(
  text: string
): string {

  return text
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase();

}


// ============================================================
// ESTILOS
// ============================================================

const styles =
  StyleSheet.create({


    // ========================================================
    // SELECTOR
    // ========================================================

    selector: {

      minHeight: 56,

      flexDirection: "row",

      alignItems: "center",

      justifyContent:
        "space-between",

      paddingHorizontal: 16,

      backgroundColor:
        "#ffffff",

      borderWidth: 1,

      borderColor:
        "#cbd5e1",

      borderRadius: 14,

    },


    selectorDisabled: {

      opacity: 0.5,

      backgroundColor:
        "#f1f5f9",

    },


    selectorTextContainer: {

      flex: 1,

      minWidth: 0,

      paddingRight: 10,

    },


    selectorText: {

      fontSize: 16,

      fontWeight: "600",

      color: "#0f172a",

    },


    placeholderText: {

      fontWeight: "400",

      color: "#94a3b8",

    },


    selectorCode: {

      marginTop: 2,

      fontSize: 12,

      color: "#94a3b8",

    },


    arrow: {

      fontSize: 12,

      color: "#64748b",

    },


    // ========================================================
    // MODAL
    // ========================================================

    modalOverlay: {

      flex: 1,

      justifyContent:
        "flex-end",

      backgroundColor:
        "rgba(15, 23, 42, 0.45)",

    },


    overlayPressArea: {

      flex: 1,

    },


    modalContainer: {

      height: "78%",

      backgroundColor:
        "#f8fafc",

      borderTopLeftRadius: 24,

      borderTopRightRadius: 24,

      overflow: "hidden",

    },


    // ========================================================
    // CABEÇALHO DO MODAL
    // ========================================================

    modalHeader: {

      flexDirection: "row",

      alignItems: "center",

      justifyContent:
        "space-between",

      paddingHorizontal: 20,

      paddingTop: 20,

      paddingBottom: 14,

      backgroundColor:
        "#ffffff",

      borderBottomWidth: 1,

      borderBottomColor:
        "#e2e8f0",

    },


    modalTitle: {

      fontSize: 21,

      fontWeight: "800",

      color: "#0f172a",

    },


    modalSubtitle: {

      marginTop: 3,

      fontSize: 13,

      color: "#64748b",

    },


    closeButton: {

      width: 44,

      height: 44,

      alignItems: "center",

      justifyContent:
        "center",

      borderRadius: 22,

      backgroundColor:
        "#f1f5f9",

    },


    closeButtonText: {

      fontSize: 18,

      fontWeight: "600",

      color: "#475569",

    },


    // ========================================================
    // PESQUISA
    // ========================================================

    searchContainer: {

      flexDirection: "row",

      alignItems: "center",

      marginHorizontal: 16,

      marginTop: 14,

      marginBottom: 8,

      paddingHorizontal: 14,

      backgroundColor:
        "#ffffff",

      borderWidth: 1,

      borderColor:
        "#cbd5e1",

      borderRadius: 14,

    },


    searchIcon: {

      marginRight: 8,

      fontSize: 15,

    },


    searchInput: {

      flex: 1,

      minHeight: 50,

      fontSize: 16,

      color: "#0f172a",

    },


    // ========================================================
    // LISTA
    // ========================================================

    listContent: {

      paddingHorizontal: 16,

      paddingTop: 6,

      paddingBottom: 30,

    },


    languageItem: {

      minHeight: 62,

      flexDirection: "row",

      alignItems: "center",

      justifyContent:
        "space-between",

      marginBottom: 7,

      paddingHorizontal: 16,

      paddingVertical: 10,

      backgroundColor:
        "#ffffff",

      borderWidth: 1,

      borderColor:
        "#e2e8f0",

      borderRadius: 13,

    },


    languageItemSelected: {

      borderColor:
        "#2563eb",

      backgroundColor:
        "#eff6ff",

    },


    languageInfo: {

      flex: 1,

      minWidth: 0,

      paddingRight: 12,

    },


    languageName: {

      fontSize: 15,

      fontWeight: "600",

      color: "#334155",

    },


    languageNameSelected: {

      fontWeight: "800",

      color: "#1d4ed8",

    },


    languageCode: {

      marginTop: 3,

      fontSize: 12,

      color: "#94a3b8",

      textTransform:
        "uppercase",

    },


    // ========================================================
    // MARCAÇÃO SELECIONADO
    // ========================================================

    selectedCircle: {

      width: 28,

      height: 28,

      alignItems: "center",

      justifyContent:
        "center",

      backgroundColor:
        "#2563eb",

      borderRadius: 14,

    },


    selectedIcon: {

      fontSize: 16,

      fontWeight: "900",

      color: "#ffffff",

    },


    // ========================================================
    // LISTA VAZIA
    // ========================================================

    emptyList: {

      flexGrow: 1,

      justifyContent:
        "center",

    },


    emptyContainer: {

      alignItems: "center",

      paddingHorizontal: 30,

      paddingBottom: 60,

    },


    emptyIcon: {

      marginBottom: 12,

      fontSize: 42,

    },


    emptyTitle: {

      fontSize: 17,

      fontWeight: "800",

      color: "#334155",

    },


    emptyDescription: {

      marginTop: 6,

      textAlign: "center",

      fontSize: 14,

      lineHeight: 20,

      color: "#94a3b8",

    },

  });