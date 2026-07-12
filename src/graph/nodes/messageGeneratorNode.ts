import {
  getSystemPrompt,
  getUserPromptTemplate,
  MessageSchema,
} from "../../prompts/v1/messageGenerator.ts";
import { OpenRouterService } from "../../services/openRouterService.ts";
import type { GraphState } from "../graph.ts";
import { AIMessage } from "langchain";

export function createMessageGeneratorNode(llmClient: OpenRouterService) {
  return async (state: GraphState): Promise<GraphState> => {
    console.log(`💬 Generating response message...`);

    try {
      const hasSuccessfulAction = state.actionSuccess === true;

      const scenario = `${state.intent ?? "unknown"}_${hasSuccessfulAction ? "success" : "error"}`;

      const details = {
        professionalName: state.professionalName,
        datetime: state.datetime,
        reason: state.reason,
        patientName: state.patientName,
        error: state.error,
      };

      const systemPrompt = getSystemPrompt();
      const userPromptTemplate = getUserPromptTemplate({ scenario, details });

      const result = await llmClient.generateStructured(
        systemPrompt,
        userPromptTemplate,
        MessageSchema,
      );

      console.log(
        `💬 Generated message: ${result.data?.message ?? result.data ?? result}`,
      );

      if (result.error) {
        console.error("❌ Error generating message:", result.error);
        return {
          messages: [
            ...state.messages,
            new AIMessage(
              "Desculpe, ocorreu um erro ao gerar a mensagem. Por favor, tente novamente mais tarde.",
            ),
          ],
        };
      }

      return {
        messages: [...state.messages, new AIMessage(result.data?.message)],
      };
    } catch (error) {
      console.error("❌ Error in messageGenerator node:", error);
      return {
        messages: [
          ...state.messages,
          new AIMessage(
            "Desculpe, ocorreu um erro ao processar sua solicitação.",
          ),
        ],
      };
    }
  };
}
