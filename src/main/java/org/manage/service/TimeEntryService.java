package org.manage.service;

import io.quarkus.panache.common.Page;
import org.manage.domain.Member;
import org.manage.domain.TimeEntry;
import org.manage.service.dto.TimeEntryDTO;
import org.manage.service.mapper.TimeEntryMapper;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import javax.transaction.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@ApplicationScoped
@Transactional
public class TimeEntryService {

    private final Logger log = LoggerFactory.getLogger(TimeEntryService.class);

    @Inject
    TimeEntryMapper timeEntryMapper;

    @Transactional
    public TimeEntryDTO persistOrUpdate(TimeEntryDTO timeEntryDTO) {
        log.debug("Request to save TimeEntry : {}", timeEntryDTO);
        var timeEntry = timeEntryMapper.toEntity(timeEntryDTO);
        timeEntry = TimeEntry.persistOrUpdate(timeEntry);
        return timeEntryMapper.toDto(timeEntry);
    }

    /**
     * Delete the TimeEntry by id.
     *
     * @param id the id of the entity.
     */
    @Transactional
    public void delete(Long id) {
        log.debug("Request to delete TimeEntry : {}", id);
        TimeEntry.findByIdOptional(id).ifPresent(timeEntry -> {
            timeEntry.delete();
        });
    }

    /**
     * Get one timeEntry by id.
     *
     * @param id the id of the entity.
     * @return the entity.
     */
    public Optional<TimeEntryDTO> findOne(Long id) {
        log.debug("Request to get TimeEntry : {}", id);
        return TimeEntry.findByIdOptional(id)
            .map(timeEntry -> timeEntryMapper.toDto((TimeEntry) timeEntry));
    }

    /**
     * Get all the timeEntries.
     * @param page the pagination information.
     * @return the list of entities.
     */
    public Paged<TimeEntryDTO> findAll(Page page) {
        log.debug("Request to get all TimeEntries");
        return new Paged<>(TimeEntry.findAll().page(page))
            .map(timeEntry -> timeEntryMapper.toDto((TimeEntry) timeEntry));
    }


    public List<TimeEntryDTO> findByDateAndMember(Long memberId, LocalDate date) {
        log.debug("Request to find all TimeEntries by member{} and date{}", memberId, date);
        return TimeEntry.getAllByDateBetweenAndMemberId(date, Member.findById(memberId))
        .map(t->timeEntryMapper.toDto(t))
            .collect(Collectors.toList());
    }
}