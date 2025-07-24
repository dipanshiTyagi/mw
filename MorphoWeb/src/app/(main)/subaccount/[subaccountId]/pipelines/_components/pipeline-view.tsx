"use client";
import React, { useEffect, useState } from "react";

import {
  LaneDetail,
  PipelineDetailsWithLanesCardsTagsTickets,
  TicketAndTags,
} from "@/lib/types";
import { Lane, Ticket } from "@prisma/client";
import { useModal } from "@/providers/modal-provider";
import { useRouter } from "next/navigation";
import { DragDropContext, DropResult, Droppable } from "react-beautiful-dnd";
import { Button } from "@/components/ui/button";
import { Flag, Plus } from "lucide-react";
import CustomModal from "@/components/global/custom-modal";
import LaneForm from "@/components/forms/lane-form";
import PipelineLane from "./pipeline-lane";

type Props = {
  lanes: LaneDetail[];
  pipelineId: string;
  subaccountId: string;
  pipelineDetails: PipelineDetailsWithLanesCardsTagsTickets;
  updateLanesOrder: (lanes: Lane[]) => Promise<void>;
  updateTicketsOrder: (tickets: Ticket[]) => Promise<void>;
};

const PipelineView = ({
  lanes,
  pipelineDetails,
  pipelineId,
  subaccountId,
  updateLanesOrder,
  updateTicketsOrder,
}: Props) => {
  const { setOpen } = useModal();
  const router = useRouter();
  const [allLanes, setAllLanes] = useState<LaneDetail[]>([]);

  useEffect(() => {
    setAllLanes(lanes);
  }, [lanes]);

  const ticketsFromAllLanes: TicketAndTags[] = [];
  lanes.forEach((lane) => {
    lane.Tickets.forEach((ticket) => {
      ticketsFromAllLanes.push(ticket);
    });
  });

  const [allTickets, setAllTickets] = useState(ticketsFromAllLanes);

  const handleAddLane = () => {
    setOpen(
      <CustomModal
        title="Create a Lane"
        subheading="Lanes allow you to group tickets"
      >
        <LaneForm pipelineId={pipelineId} />
      </CustomModal>
    );
  };

  const onDragEnd = (dropResult: DropResult) => {
    console.log(dropResult);
    const { destination, source, type } = dropResult;
    if (
      !destination ||
      (destination.droppableId === source.droppableId &&
        destination.index === source.index)
    )
      return;

    switch (type) {
      case "lane": {
        const newLanes = [...allLanes]
          .toSpliced(source.index, 1)
          .toSpliced(destination.index, 0, allLanes[source.index])
          .map((lane, idx) => {
            return { ...lane, order: idx };
          });
        setAllLanes(newLanes);
        updateLanesOrder(newLanes);
        break;
      }
      case "ticket": {
        let newLanes = [...allLanes];
        const originLane = newLanes.find(
          (lane) => lane.id === source.droppableId
        );
        const destinationLane = newLanes.find(
          (lane) => lane.id === destination.droppableId
        );

        if (!originLane || !destinationLane) {
          return;
        }

        if (source.droppableId === destination.droppableId) {
          const newOrderedTickets = [...originLane.Tickets]
            .toSpliced(source.index, 1)
            .toSpliced(destination.index, 0, originLane.Tickets[source.index])
            .map((item, idx) => {
              return { ...item, order: idx };
            });
          originLane.Tickets = newOrderedTickets;
          setAllLanes(newLanes);
          updateTicketsOrder(newOrderedTickets);
          router.refresh();
        } else {
          const [currentTicket] = originLane.Tickets.splice(source.index, 1);

          originLane.Tickets.forEach((ticket, idx) => {
            ticket.order = idx;
          });

          destinationLane.Tickets.splice(destination.index, 0, {
            ...currentTicket,
            laneId: destination.droppableId,
          });

          destinationLane.Tickets.forEach((ticket, idx) => {
            ticket.order = idx;
          });
          setAllLanes(newLanes);
          updateTicketsOrder([
            ...destinationLane.Tickets,
            ...originLane.Tickets,
          ]);
          router.refresh();
        }
      }
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="bg-white/60 dark:bg-background/60 rounded-xl p-4 use-automation-zoom-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl">{pipelineDetails?.name}</h1>
          <Button className="flex items-center gap-4" onClick={handleAddLane}>
            <Plus size={16} />
            Create Lane
          </Button>
        </div>

        <Droppable
          droppableId="lanes"
          type="lane"
          direction="horizontal"
          key={"lanes"}
        >
          {(provided) => (
            <div
              className="flex items-center gap-x-2 overflow-scroll no-scrollbar"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              <div className="flex mt-4">
                {allLanes.map((lane, index) => (
                  <PipelineLane
                    key={lane.id}
                    allTickets={allTickets}
                    index={index}
                    laneDetails={lane}
                    pipelineId={pipelineId}
                    tickets={lane.Tickets}
                    setAllTickets={setAllTickets}
                    subaccountId={subaccountId}
                  />
                ))}
                {provided.placeholder}
              </div>
            </div>
          )}
        </Droppable>

        {allLanes.length === 0 && (
          <div className="flex items-center justify-center w-full flex-col">
            <div className="opacity-100">
              <Flag
                width={"100%"}
                height={"100%"}
                className="text-muted-foreground"
              />
            </div>
          </div>
        )}
      </div>
    </DragDropContext>
  );
};

export default PipelineView;
